class Parameters:
    def __init__(self):
        self.target_size = 8  # FERPlus has 8 emotions
        self.width = 224      # Resize for ResNet-18
        self.height = 224     # Resize for ResNet-18
        self.shuffle = True   # Shuffle data for training
        self.training_mode = "crossentropy"  # crossentropy
        self.determinisitc = True  # Enable data augmentation

        # Data augmentation settings
        self.max_shift = 0.1  
        self.max_scale = 1.2   
        self.max_angle = 20.0  
        self.max_skew = 0.1
        self.do_flip = True        