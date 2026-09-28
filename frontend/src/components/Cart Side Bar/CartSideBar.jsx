import "./CartSideBar.css";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../Context/CartContext";
import { useAuth } from "../../context/AuthContext";

function CartSidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        cartItems,
        increaseQuantity,
        decreaseQuantity
    } = useContext(CartContext);

    const subtotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const deliveryFee = cartItems.length > 0 ? 150 : 0;

    const total = subtotal + deliveryFee;
    
    return (
        <>
            <div
                className={`cart-overlay ${isOpen ? "show" : ""}`}
                onClick={onClose}
            />

            <div className={`cart-sidebar ${isOpen ? "open" : ""}`}>

                <div className="cart-header">
                    <h2>Your Tokri</h2>

                    <button
                        className="close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="cart-count">
                    {
                        cartItems.reduce(
                            (total, item) => total + item.quantity,
                            0
                        )
                    } Items
                </div>

                {/* Removed the duplicate cart-items wrapper here */}
                <div className="cart-items">

                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            Your Tokri is empty 
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div className="cart-item" key={item._id}>

                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="cart-item-image"
                                />

                                <div className="item-info">

                                    <h4>{item.name}</h4>

                                    <p>
                                        Rs {item.price}
                                    </p>

                                    <div className="qty-controls">

                                        <button
                                            onClick={() =>
                                                decreaseQuantity(item._id)
                                            }
                                        >
                                            −
                                        </button>

                                        <span>{item.quantity}</span>

                                        <button
                                            onClick={() =>
                                                increaseQuantity(item._id)
                                            }
                                        >
                                            +
                                        </button>

                                    </div>

                                </div>

                            </div>
                        ))
                    )}

                </div>

                {/* Moved cart-footer outside of cart-items so it sits at the bottom of the flex column */}
                <div className="cart-footer">

                    <div className="price-row">
                        <span>Items Subtotal</span>
                        <span>Rs {subtotal}</span>
                    </div>

                    <div className="price-row">
                        <span>Delivery Charge</span>
                        <div style={{ textAlign: 'right' }}>
                            <span>Min. Rs 150</span>
                            <span style={{ display: 'block', fontSize: '10px', color: '#888', fontWeight: 'normal' }}>Varies based on distance</span>
                        </div>
                    </div>

                    <div className="price-row total">
                        <div>
                            <span>Cart Total</span>
                            <span style={{ display: 'block', fontSize: '10px', color: '#e53e3e', fontWeight: '500' }}>⚠️ Excludes delivery charges</span>
                        </div>
                        <span>Rs {subtotal}</span>
                    </div>

                    <button 
                        className="checkout-btn"
                        disabled={cartItems.length === 0}
                        onClick={() => {
                            if (!user) {
                                navigate('/login');
                            } else {
                                navigate('/checkout');
                            }
                            onClose();
                        }}
                    >
                        Proceed To Checkout
                    </button>

                </div>

            </div>
        </>
    );
}

export default CartSidebar;