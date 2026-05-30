import "./CartSidebar.css";
import { useContext } from "react";
import { CartContext } from "../Context/CartContext";

function CartSidebar({ isOpen, onClose }) {
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
                            <div className="cart-item" key={item.id}>

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
                                                decreaseQuantity(item.id)
                                            }
                                        >
                                            −
                                        </button>

                                        <span>{item.quantity}</span>

                                        <button
                                            onClick={() =>
                                                increaseQuantity(item.id)
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
                        <span>Subtotal</span>
                        <span>Rs {subtotal}</span>
                    </div>

                    <div className="price-row">
                        <span>Delivery</span>
                        <span>Rs {deliveryFee}</span>
                    </div>

                    <div className="price-row total">
                        <span>Total</span>
                        <span>Rs {total}</span>
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