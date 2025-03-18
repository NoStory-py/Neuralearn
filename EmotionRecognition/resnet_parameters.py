class Parameters:
    def __init__(self):
        self.target_size = 8  # FERPlus has 8 emotions
        self.width = 224      # Resize for ResNet-18
        self.height = 224     # Resize for ResNet-18
        self.shuffle = True   # Shuffle data for training
        self.training_mode = "crossentropy"  # crossentropy
        self.determinisitc = True  # Enable data augmentation

        # Data augmentation settings
        self.max_shift = 0.05    
        self.max_scale = 1.1    
        self.max_angle = 15.0    
        self.max_skew = 0.03    
        self.do_flip = True      