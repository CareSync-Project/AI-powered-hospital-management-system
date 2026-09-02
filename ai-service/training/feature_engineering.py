FEATURE_SOURCES = {
    "fever": ["fever"],
    "headache": ["headache", "frontal headache"],
    "cough": ["cough"],
    "runny_nose": ["coryza", "nasal congestion"],
    "body_aches": ["ache all over"],
    "weakness": ["weakness", "fatigue", "feeling ill"],
    "vomiting": ["vomiting"],
    "diarrhoea": ["diarrhea"],
    "abdominal_pain": ["sharp abdominal pain", "lower abdominal pain", "upper abdominal pain", "burning abdominal pain"],
    "difficulty_breathing": ["shortness of breath", "difficulty breathing", "wheezing", "breathing fast"],
    "chest_pain": ["sharp chest pain", "burning chest pain", "chest tightness"],
    "dizziness": ["dizziness"],
    "rash": ["skin rash", "skin irritation", "abnormal appearing skin"],
    "itching": ["itching of skin"],
    "sore_throat": ["sore throat", "swollen or red tonsils"],
    "ear_pain": ["ear pain", "plugged feeling in ear", "itchy ear(s)", "fluid in ear"],
    "eye_pain": ["pain in eye", "eye redness", "itchiness of eye", "lacrimation"],
    "toothache": ["toothache", "gum pain", "pain in gums"],
    "back_pain": ["back pain", "low back pain"],
    "joint_pain": ["joint pain", "knee pain", "hip pain"],
    "painful_urination": ["painful urination", "frequent urination", "blood in urine"],
    "nausea": ["nausea"],
    "allergic_reaction": ["allergic reaction", "sneezing"],
}
FEATURE_ORDER = list(FEATURE_SOURCES)

LABEL_GROUPS = {
    "viral_respiratory_illness": ["common cold", "acute bronchitis"],
    "ent_concern": ["acute sinusitis", "strep throat", "otitis media", "otitis externa (swimmer's ear)", "eustachian tube dysfunction (ear disorder)", "nose disorder"],
    "gastrointestinal_illness": ["infectious gastroenteritis", "noninfectious gastroenteritis"],
    "urinary_tract_concern": ["urinary tract infection", "cystitis"],
    "allergy_related_condition": ["seasonal allergies (hay fever)", "allergy", "conjunctivitis due to allergy"],
    "asthma_like_respiratory_concern": ["asthma", "acute bronchospasm"],
    "eye_related_condition": ["conjunctivitis", "stye", "cornea infection"],
}

LABEL_TO_DEPARTMENT = {
    "viral_respiratory_illness": "GENERAL",
    "ent_concern": "ENT",
    "gastrointestinal_illness": "GENERAL",
    "urinary_tract_concern": "GENERAL",
    "allergy_related_condition": "GENERAL",
    "asthma_like_respiratory_concern": "GENERAL",
    "eye_related_condition": "EYE",
}

def reverse_label_mapping():
    return {source: category for category, sources in LABEL_GROUPS.items() for source in sources}

def project_features(frame):
    projected = {}
    for feature, source_columns in FEATURE_SOURCES.items():
        missing = [column for column in source_columns if column not in frame.columns]
        if missing:
            raise ValueError(f"Dataset is missing required source columns: {missing}")
        projected[feature] = frame[source_columns].fillna(0).max(axis=1).astype(int)
    return frame.__class__(projected, index=frame.index)[FEATURE_ORDER]
