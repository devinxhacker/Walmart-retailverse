const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const generateModelRoutes = require('./routes/generateModel');
const Product = require('./models/Product');
const chatbotRoutes = require('./routes/chatbot');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const modelCheckRoutes = require('./routes/modelCheck');
app.use(modelCheckRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Create sample products if none exist
const createSampleProducts = async () => {
  try {
    const count = await Product.countDocuments();

    if (count === 0) {
      const sampleProducts = [
        {
          name: 'iPhone 15 Pro',
          image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
          description: 'Latest iPhone with advanced camera system and A17 Pro chip',
          brand: 'Apple',
          category: 'Electronics',
          price: 999.99,
          countInStock: 50,
          rating: 4.5,
          numReviews: 12
        },
        {
          name: 'Samsung 4K Smart TV',
          image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
          description: '55-inch 4K Ultra HD Smart TV with Crystal Display',
          brand: 'Samsung',
          category: 'Electronics',
          price: 799.99,
          countInStock: 25,
          rating: 4.3,
          numReviews: 8
        },
        {
          name: 'Nike Air Max 270',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
          description: 'Comfortable running shoes with Air Max technology',
          brand: 'Nike',
          category: 'Clothing',
          price: 129.99,
          countInStock: 100,
          rating: 4.7,
          numReviews: 25
        },
        {
          name: 'MacBook Air M2',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          description: 'Lightweight laptop with M2 chip and all-day battery life',
          brand: 'Apple',
          category: 'Electronics',
          price: 1199.99,
          countInStock: 30,
          rating: 4.8,
          numReviews: 18
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('Sample products created successfully');
    }
  } catch (err) {
    console.error('Error creating sample products:', err);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', generateModelRoutes);
app.use('/api/chatbot', chatbotRoutes); // Add this line


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  createSampleProducts();
});