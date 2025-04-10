import pandas as pd
import numpy as np
from sklearn.utils import shuffle

# =================================================================
# 1. Data Loading & Cleaning
# =================================================================

def load_names(file_path):
    """Load and process names dataset"""
    with open(file_path, 'r') as f:
        names = [name.strip().lower() for name in f.readlines()]
    return names

def load_colors(file_path):
    """Load and process color names"""
    color_df = pd.read_csv(file_path)
    return color_df['Name'].str.lower().tolist()

def load_foods(indian_path, western_path):
    """Load and merge food datasets"""
    # Indian foods
    indian_df = pd.read_csv(indian_path)
    indian_foods = indian_df['name'].str.lower().str.replace('-', ' ').tolist()
    
    # Western foods
    west_df = pd.read_csv(western_path)
    west_foods = west_df['ClassName'].str.lower().tolist()
    
    # Filter non-food items
    food_blacklist = {'water', 'bread-white', 'white-coffee-with-caffeine', 
                     'espresso-with-caffeine', 'mixed-salad-chopped-without-sauce'}
    west_foods = [f for f in west_foods if f not in food_blacklist]
    
    return indian_foods + west_foods

def load_animals(file_path):
    """Load and clean animal names"""
    with open(file_path, 'r') as f:
        raw_animals = [word.strip().lower() for line in f for word in line.split(',')]
    
    # Remove invalid entries
    animal_blacklist = {'breeds', 'list', 'strains', 'varieties', 'laboratory'}
    return [a for a in raw_animals if a not in animal_blacklist and len(a) > 2]

# =================================================================
# 2. Dataset Generation
# =================================================================

def generate_valid_examples(names, colors, foods, animals):
    """Create valid question-response pairs"""
    data = []
    
    # Names
    for name in names:
        data.append({
            'question': 'what is your name?',
            'response': name,
            'label': 'name'
        })
    
    # Colors
    for color in colors:
        data.append({
            'question': 'what is your favorite color?',
            'response': color,
            'label': 'color'
        })
    
    # Foods
    for food in foods:
        data.append({
            'question': 'what do you like to eat?',
            'response': food,
            'label': 'food'
        })
    
    # Animals
    for animal in animals:
        data.append({
            'question': 'what is your favorite animal?',
            'response': animal,
            'label': 'animal'
        })
    
    return data

def generate_invalid_examples(names, colors, foods, animals, num_per_category=200):
    """Create invalid cross-category examples"""
    data = []
    
    # Name questions with non-name responses
    for response in np.random.choice(colors + foods + animals, num_per_category):
        data.append({
            'question': 'what is your name?',
            'response': response,
            'label': 'invalid'
        })
    
    # Color questions with non-color responses
    for response in np.random.choice(names + foods + animals, num_per_category):
        data.append({
            'question': 'what is your favorite color?',
            'response': response,
            'label': 'invalid'
        })
    
    # Food questions with non-food responses
    for response in np.random.choice(names + colors + animals, num_per_category):
        data.append({
            'question': 'what do you like to eat?',
            'response': response,
            'label': 'invalid'
        })
    
    # Animal questions with non-animal responses
    for response in np.random.choice(names + colors + foods, num_per_category):
        data.append({
            'question': 'what is your favorite animal?',
            'response': response,
            'label': 'invalid'
        })
    
    return data

# =================================================================
# 3. Main Processing Pipeline
# =================================================================

def main():
    # Load all datasets
    names = load_names('first_name.txt')
    colors = load_colors('color_names.csv')
    foods = load_foods('indian_food.csv', 'west-food.csv')
    animals = load_animals('animals_names.txt')
    
    # Generate examples
    valid_data = generate_valid_examples(names, colors, foods, animals)
    invalid_data = generate_invalid_examples(names, colors, foods, animals)
    
    # Combine and balance
    df = pd.DataFrame(valid_data + invalid_data)
    df = shuffle(df, random_state=42)
    
    # Save final dataset
    df.to_csv('factual_training_dataset.csv', index=False)
    print(f"Dataset created with {len(df)} examples")
    print(df.label.value_counts())

if __name__ == '__main__':
    main()