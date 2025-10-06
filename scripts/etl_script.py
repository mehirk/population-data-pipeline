# scripts/etl_script.py

# all import statements here
import pandas as pd
from pathlib import Path
import os

# all functions here

def extract(file_path: Path) -> pd.DataFrame:
    # reads raw population data.
    print("extracting data\n")
    df = pd.read_csv(file_path, skiprows=4)
    print(f"extracted {len(df)} rows.")
    return df

def transform(df: pd.DataFrame) -> pd.DataFrame:
    # cleans and structures population data.
    print("transforming data\n")
    df_clean = df[["Country Name", "Country Code", "2022"]].copy()
    df_clean = df_clean.rename(columns={
        "Country Name": "country",
        "Country Code": "country_code",
        "2022": "population"
    })
    df_clean = df_clean.dropna(subset=["population"])
    df_clean["population"] = df_clean["population"].astype(int)
    print(f"cleaned dataset shape: {df_clean.shape}\n")
    return df_clean

def load(df: pd.DataFrame, output_path: Path) -> None:
    # saves processed data.
    print("saving processed data\n")
    df.to_csv(output_path, index=False)
    print(f"data is saved to: {output_path}\n")

def main():
    BASE_DIR = Path(os.getcwd()).resolve().parent if "notebooks" in os.getcwd() else Path(os.getcwd()).resolve()
    raw_path = BASE_DIR / "population-data-pipeline" / "data" / "raw" / "data.csv"
    processed_path = BASE_DIR / "population-data-pipeline" / "data" / "processed" / "population_clean.csv"

    df_raw = extract(raw_path)
    df_clean = transform(df_raw)
    load(df_clean, processed_path)

# run the main function
if __name__ == "__main__":
    main()
