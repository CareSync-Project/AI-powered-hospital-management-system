import pandas as pd

def prepare_input(payload, feature_order):
    values = {feature: int(bool(payload.symptoms.get(feature, False))) for feature in feature_order}
    if payload.temperature is not None and payload.temperature >= 38.0 and "fever" in values:
        values["fever"] = 1
    return pd.DataFrame([[values[name] for name in feature_order]], columns=feature_order)
