import "./CartSidebar.css";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

function CartSidebar({ isOpen, onClose }) {
    const { cartItems } = useContext(CartContext);
    return (
        <>
            <div
                className={`cart-overlay ${isOpen ? "show" : ""}`}
                onClick={onClose}
            />

            <div className={`cart-sidebar ${isOpen ? "open" : ""}`}>

                <div className="cart-header">
                    <h2>🧺 Your Tokri</h2>

                    <button
                        className="close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="cart-count">
                    {cartItems.length} Items
                </div>

                <div className="cart-items">

                    <div className="cart-item">
                        <img
                            src="https://placehold.co/80x80"
                            alt=""
                        />

                        <div className="item-info">
                            <h4>Chicken Karahi</h4>
                            <p>Rs 899</p>

                            <div className="qty-controls">
                                <button>-</button>
                                <span>2</span>
                                <button>+</button>
                            </div>
                        </div>
                    </div>

                    <div className="cart-item">
                        <img
                            src="https://placehold.co/80x80"
                            alt=""
                        />

                        <div className="item-info">
                            <h4>Garlic Naan</h4>
                            <p>Rs 120</p>

                            <div className="qty-controls">
                                <button>-</button>
                                <span>1</span>
                                <button>+</button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="cart-footer">

                    <div className="price-row">
                        <span>Subtotal</span>
                        <span>Rs 1918</span>
                    </div>

                    <div className="price-row">
                        <span>Delivery</span>
                        <span>Rs 150</span>
                    </div>

                    <div className="price-row total">
                        <span>Total</span>
                        <span>Rs 2068</span>
                    </div>

                    <button className="checkout-btn">
                        Proceed To Checkout
                    </button>

                </div>

            </div>
        </>
    );
}

export default CartSidebar;