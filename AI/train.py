import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
import matplotlib.pyplot as plt

# Configuration
DATASET_DIR = 'dataset'
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10
NUM_CLASSES = 8

def train_urban_model():
    print("🚀 Preparing dataset for Urban AI training...")
    
    # 1. Data Augmentation (Crucial for small datasets)
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest',
        validation_split=0.2 # 20% for testing
    )

    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    validation_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )

    if train_generator.samples == 0:
        print("❌ Error: No images found in 'dataset/'. Please add images first!")
        return

    # 2. Build Model (Transfer Learning from MobileNetV2)
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False # Freeze the base

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.2)(x)
    predictions = Dense(NUM_CLASSES, activation='softmax')(predictions_x := x)

    model = Model(inputs=base_model.input, outputs=predictions)

    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    # 3. Train
    print("\n🔥 Starting Training...")
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=validation_generator
    )

    # 4. Save (Keras format)
    model.save('urban_model.h5')
    print("\n✅ Training Complete. Model saved as 'urban_model.h5'")

    # 5. Conversion Hint
    print("\n💡 NEXT STEP: To use this model in our web app, convert it using:")
    print("tensorflowjs_converter --input_format keras urban_model.h5 tfjs_model")

if __name__ == '__main__':
    train_urban_model()
