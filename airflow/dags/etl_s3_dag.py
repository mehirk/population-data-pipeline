from datetime import datetime, timedelta
from airflow import DAG # type: ignore
from airflow.operators.python import PythonOperator # type: ignore
import subprocess

def run_etl():
    """Run your ETL script that uploads to S3"""
    try:
        result = subprocess.run(
            ["python3", "/opt/airflow/dags/etl_script.py"],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print("❌ ETL script failed!")
        print("STDOUT:\n", e.stdout)
        print("STDERR:\n", e.stderr)
        raise

default_args = {
    "owner": "mehir",
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="etl_s3_pipeline",
    default_args=default_args,
    description="Run ETL and upload to S3 daily",
    schedule_interval="@daily",
    start_date=datetime(2025, 10, 17),
    catchup=False,
    tags=["etl", "s3", "population"],
) as dag:

    run_etl_task = PythonOperator(
        task_id="run_etl_script",
        python_callable=run_etl,
    )

    run_etl_task
