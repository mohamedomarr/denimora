import { Routes, Route } from 'react-router-dom';
import Home from './components/home';
import Shop from './components/shop';
import ItemDetails from './components/itemdetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/shop-item" element={<ItemDetails />} />
      <Route path="/checkout" element={<Checkout />} />
    </Routes>
  );
}

export default App;  