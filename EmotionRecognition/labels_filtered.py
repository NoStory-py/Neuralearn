import pandas as pd

df = pd.read_csv('Datasets/FERPlus-master/data/FER2013Train/label.csv', header=None)

columns = df.columns[[0, 2, 3, 4, 5, 6, 8]]
df_filtered = df[columns]
print(df_filtered)
df_filtered.to_csv('labels_filtered.csv', index=False)

