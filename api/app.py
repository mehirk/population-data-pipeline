# FastAPI entry point for population data
import os
from datetime import datetime, timezone
from io import StringIO

import boto3
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from botocore.exceptions import ClientError

# Configuration
BUCKET = os.getenv("S3_BUCKET", "population-data-pipeline-mehir")
REGION = os.getenv("AWS_REGION", "ca-central-1")

app = FastAPI(title="Population API", version="1.0.0")

# Allow the Angular frontend to call the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Local Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to construct an S3 client
def s3_client():
    return boto3.client(
        "s3",
        region_name=REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )

# Locate the newest object in the S3 bucket
def latest_key(client):
    objects = client.list_objects_v2(Bucket=BUCKET)
    all_files = objects.get("Contents", [])
    if not all_files:
        raise HTTPException(status_code=404, detail="No files found in S3")
    latest = max(all_files, key=lambda x: x["LastModified"])
    return latest["Key"]

# Download and parse a CSV from S3
def read_csv_from_s3(client, key):
    response = client.get_object(Bucket=BUCKET, Key=key)
    body = response["Body"].read().decode("utf-8")
    return pd.read_csv(StringIO(body))

# Lightweight health check endpoint
@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}

# Primary endpoint serving the processed population dataset
@app.get("/population")
def population():
    client = s3_client()
    key = latest_key(client)
    df = read_csv_from_s3(client, key)
    return {
        "bucket": BUCKET,
        "key": key,
        "row_count": len(df),
        "rows": df.to_dict(orient="records"),
    }

# Return the top N countries by population
@app.get("/population/top/{n}")
def top_n(n: int = 10):
    client = s3_client()
    key = latest_key(client)
    df = read_csv_from_s3(client, key)
    df["population"] = pd.to_numeric(df["population"], errors="coerce")
    top = df.sort_values("population", ascending=False).head(n)
    return top.to_dict(orient="records")
