const cors = require('cors');
const express = require('express');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
  dbName: 'ECommerce',
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const connection = mongoose.connection;
  connection.once('open', () => {
  console.log('Connected to the database');
});

const Schema = mongoose.Schema;
const apiSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  title: String,
  description: { type: String, unique: false },
  price: String,
  seller: String,
  pictures: Array
});

const apiModel = mongoose.model('products', apiSchema);

const router = express.Router();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', router);

router.get('/products', async (req, res) => {
  const data = await apiModel.find();
  res.send(data);
});

router.post('/products', async (req, res) => {
  const newProduct = new apiModel(req.body);
  await newProduct.save();
  res.send(newProduct);
});

router.delete('/delete-product/:id', async (req, res) => {
  await apiModel.findByIdAndDelete(req.params.id);
  res.send('Product deleted');
});

const registerSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },
    email: String,
    password: String,
    username: String,
    address: String,
    phone: String,
    seller: Boolean,
    shoppingCart: Array
});

const registerModel = mongoose.model('users', registerSchema);

router.post('/register', async (req, res) => {
  const { email } = req.body;
  try {
    const userExists = await registerModel.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const newUser = new registerModel(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await registerModel.findOne({ email });

    if (user.email === email && user.password === password) {
      res.status(200).json(user);
    } else 
      res.status(401).json({ message: 'Invalid credentials' });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/shopping-cart', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await registerModel.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const shoppingCart = user.shoppingCart;
    const products = [];

    // inserisci nell'array products tutti i prodotti che hanno un id presente nell'array shoppingCart

    for (let i = 0; i < shoppingCart.length; i++) {
      const product = await apiModel.findById(shoppingCart[i]);
      products.push(product);
    }

    res.json(products);
    
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/shopping-cart-add', async (req, res) => {
  const { email, password, productId } = req.body;

  try {
    const user = await registerModel.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.shoppingCart.push(productId);
    await user.save();

    res.json(user);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/shopping-cart', async (req, res) => {
  const { email, password, productId } = req.body;

  try {
    const user = await registerModel.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const index = user.shoppingCart.indexOf(productId);
    if (index > -1) {
      user.shoppingCart.splice(index, 1);
    }

    await user.save();

    res.json(user);
  }
    catch (err) {
      res.status(400).json({ message: err.message });
    }
  });


  router.post('/checkout', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await registerModel.findOne({ email, password });
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const shoppingCart = user.shoppingCart;
      const products = [];
  
      for (let i = 0; i < shoppingCart.length; i++) {
        const product = await apiModel.findById(shoppingCart[i]);
        products.push(product);
      }
  
      user.shoppingCart = [];
      await user.save();
  
      res.json({ message: 'Checkout successful', products });
      
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  




app.listen(5100, () => console.log(`Listening on port 5100`));
