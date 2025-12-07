// controllers/orderController.js
import Order from '../models/orderModel.js';
import CartProduct from '../models/cartProductModel.js';
import Product from '../models/productModel.js';
import { v4 as uuidv4 } from 'uuid';

// Create new order
export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { delivery_address, payment_method = 'cod', notes = '' } = req.body;

        // Validate required fields
        if (!delivery_address) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address is required'
            });
        }

        // Get user's cart
        const cartItems = await CartProduct.find({ userId }).populate('productId');
        
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Calculate order totals and validate stock
        let subtotal = 0;
        let totalSavings = 0;
        const orderItems = [];

        for (const cartItem of cartItems) {
            const product = cartItem.productId;
            
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product not found for cart item ${cartItem._id}`
                });
            }

            // Check stock availability
            if (cartItem.quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} items available for ${product.name}`
                });
            }

            // Calculate pricing
            const isWholesale = product.wholesaleEnabled && cartItem.quantity >= (product.moq || 1);
            const currentPrice = isWholesale ? product.wholesalePrice : product.price;
            const itemSubtotal = currentPrice * cartItem.quantity;
            const savings = isWholesale ? (product.price - product.wholesalePrice) * cartItem.quantity : 0;

            subtotal += itemSubtotal;
            totalSavings += savings;

            orderItems.push({
                productId: product._id,
                name: product.name,
                image: product.images[0]?.url || '',
                quantity: cartItem.quantity,
                price: currentPrice,
                pricingTier: isWholesale ? 'wholesale' : 'retail'
            });
        }

        // Calculate shipping (free over $50)
        const shipping = subtotal > 50 ? 0 : 5;
        const total = subtotal + shipping;

        // Generate unique order ID
        const orderId = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;

        // Create order
        const order = new Order({
            userId,
            orderId,
            items: orderItems,
            delivery_address,
            subtotal,
            shipping,
            total,
            totalSavings,
            payment_method,
            notes,
            order_status: 'pending',
            payment_status: 'pending'
        });

        await order.save();

        // Clear cart after successful order creation
        await CartProduct.deleteMany({ userId });

        // Populate the order for response
        await order.populate('delivery_address');

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};






// // controllers/orderController.js - Update the createOrder function
// export const createOrder = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { delivery_address, payment_method = 'cod', notes = '' } = req.body;

//         // Validate required fields
//         if (!delivery_address) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Delivery address is required'
//             });
//         }

//         // Get the address from database
//         const address = await Address.findOne({ _id: delivery_address, userId });
        
//         if (!address) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Address not found'
//             });
//         }

//         // Get user's cart
//         const cartItems = await CartProduct.find({ userId }).populate('productId');
        
//         if (!cartItems || cartItems.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cart is empty'
//             });
//         }

//         // Calculate order totals and validate stock
//         let subtotal = 0;
//         let totalSavings = 0;
//         const orderItems = [];

//         for (const cartItem of cartItems) {
//             const product = cartItem.productId;
            
//             if (!product) {
//                 return res.status(400).json({
//                     success: false,
//                     message: `Product not found for cart item ${cartItem._id}`
//                 });
//             }

//             // Check stock availability
//             if (cartItem.quantity > product.stock) {
//                 return res.status(400).json({
//                     success: false,
//                     message: `Only ${product.stock} items available for ${product.name}`
//                 });
//             }

//             // Calculate pricing
//             const isWholesale = product.wholesaleEnabled && cartItem.quantity >= (product.moq || 1);
//             const currentPrice = isWholesale ? product.wholesalePrice : product.price;
//             const itemSubtotal = currentPrice * cartItem.quantity;
//             const savings = isWholesale ? (product.price - product.wholesalePrice) * cartItem.quantity : 0;

//             subtotal += itemSubtotal;
//             totalSavings += savings;

//             orderItems.push({
//                 productId: product._id,
//                 name: product.name,
//                 image: product.images[0]?.url || '',
//                 quantity: cartItem.quantity,
//                 price: currentPrice,
//                 pricingTier: isWholesale ? 'wholesale' : 'retail'
//             });
//         }

//         // Calculate shipping (free over $50)
//         const shipping = subtotal > 50 ? 0 : 5;
//         const total = subtotal + shipping;

//         // Generate unique order ID
//         const orderId = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;

//         // Create order
//         const order = new Order({
//             userId,
//             orderId,
//             items: orderItems,
//             delivery_address: address._id, // Store the address ID
//             subtotal,
//             shipping,
//             total,
//             totalSavings,
//             payment_method,
//             notes,
//             order_status: 'pending',
//             payment_status: 'pending'
//         });

//         await order.save();

//         // Clear cart after successful order creation
//         await CartProduct.deleteMany({ userId });

//         // Populate the order for response
//         await order.populate('delivery_address');

//         res.status(201).json({
//             success: true,
//             message: 'Order created successfully',
//             data: order
//         });

//     } catch (error) {
//         console.error('Create order error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating order',
//             error: error.message
//         });
//     }
// };



// Get user's orders








export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ userId })
            .populate('delivery_address')
            .populate('items.productId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get single order
export const getOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ orderId, userId })
            .populate('delivery_address')
            .populate('items.productId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Update order status (for admin)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { order_status } = req.body;

        const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
        
        if (!validStatuses.includes(order_status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        const order = await Order.findOneAndUpdate(
            { orderId },
            { order_status },
            { new: true }
        ).populate('delivery_address').populate('items.productId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order',
            error: error.message
        });
    }
};




// // // ///////////////////////////// ORDER ADMIN 
 

// // // // Get all orders (admin only)
// // // export const getAllOrders = async (req, res) => {
// // //     try {
// // //         const { page = 1, limit = 50, search = '', status = '', type = '' } = req.query;
        
// // //         // Build filter object
// // //         const filter = {};
        
// // //         if (search) {
// // //             filter.$or = [
// // //                 { orderId: { $regex: search, $options: 'i' } },
// // //                 { 'userId.email': { $regex: search, $options: 'i' } },
// // //                 { 'delivery_address.phone': { $regex: search, $options: 'i' } },
// // //                 { 'items.name': { $regex: search, $options: 'i' } }
// // //             ];
// // //         }
        
// // //         if (status) {
// // //             filter.order_status = status;
// // //         }
        
// // //         if (type === 'wholesale') {
// // //             filter['items.pricingTier'] = 'wholesale';
// // //         } else if (type === 'retail') {
// // //             filter['items.pricingTier'] = 'retail';
// // //         }

// // //         const orders = await Order.find(filter)
// // //             .populate('userId', 'name email')
// // //             .populate('delivery_address')
// // //             .populate('items.productId')
// // //             .sort({ createdAt: -1 })
// // //             .limit(limit * 1)
// // //             .skip((page - 1) * limit);

// // //         const total = await Order.countDocuments(filter);

// // //         return res.json({
// // //             message: "Orders retrieved successfully",
// // //             error: false,
// // //             success: true,
// // //             data: orders,
// // //             pagination: {
// // //                 currentPage: parseInt(page),
// // //                 totalPages: Math.ceil(total / limit),
// // //                 totalOrders: total,
// // //                 ordersPerPage: parseInt(limit)
// // //             }
// // //         });
// // //     } catch (error) {
// // //         console.error("Get all orders error:", error);
// // //         return res.status(500).json({
// // //             message: error.message || "Internal server error",
// // //             error: true,
// // //             success: false
// // //         });
// // //     }
// // // };

// // // Update order status (admin only)

// // // In controllers/orderController.js - Fix getAllOrders response
// // export const getAllOrders = async (req, res) => {
// //     try {
// //         const { page = 1, limit = 50, search = '', status = '', type = '' } = req.query;
        
// //         // Build filter object
// //         const filter = {};
        
// //         if (search) {
// //             filter.$or = [
// //                 { orderId: { $regex: search, $options: 'i' } },
// //                 { 'userId.email': { $regex: search, $options: 'i' } },
// //                 { 'delivery_address.phone': { $regex: search, $options: 'i' } },
// //                 { 'items.name': { $regex: search, $options: 'i' } }
// //             ];
// //         }
        
// //         if (status) {
// //             filter.order_status = status;
// //         }
        
// //         if (type === 'wholesale') {
// //             filter['items.pricingTier'] = 'wholesale';
// //         } else if (type === 'retail') {
// //             filter['items.pricingTier'] = 'retail';
// //         }

// //         const orders = await Order.find(filter)
// //             .populate('userId', 'name email')
// //             .populate('delivery_address')
// //             .populate('items.productId')
// //             .sort({ createdAt: -1 })
// //             .limit(limit * 1)
// //             .skip((page - 1) * limit);

// //         const total = await Order.countDocuments(filter);

// //         // FIXED: Return data in the expected format
// //         return res.json({
// //             success: true,
// //             message: "Orders retrieved successfully",
// //             data: orders, // This is what the frontend expects
// //             pagination: {
// //                 currentPage: parseInt(page),
// //                 totalPages: Math.ceil(total / limit),
// //                 totalOrders: total,
// //                 ordersPerPage: parseInt(limit)
// //             }
// //         });
// //     } catch (error) {
// //         console.error("Get all orders error:", error);
// //         return res.status(500).json({
// //             success: false,
// //             message: error.message || "Internal server error",
// //             error: true
// //         });
// //     }
// // };


// // export const updateOrderStatusAdmin = async (req, res) => {
// //     try {
// //         const { id } = req.params;
// //         const { order_status } = req.body;

// //         const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
        
// //         if (!validStatuses.includes(order_status)) {
// //             return res.status(400).json({
// //                 message: "Invalid order status",
// //                 error: true,
// //                 success: false
// //             });
// //         }

// //         const order = await Order.findByIdAndUpdate(
// //             id,
// //             { order_status },
// //             { new: true }
// //         )
// //         .populate('userId', 'name email')
// //         .populate('delivery_address')
// //         .populate('items.productId');

// //         if (!order) {
// //             return res.status(404).json({
// //                 message: "Order not found",
// //                 error: true,
// //                 success: false
// //             });
// //         }

// //         return res.json({
// //             message: "Order status updated successfully",
// //             error: false,
// //             success: true,
// //             data: order
// //         });
// //     } catch (error) {
// //         console.error("Update order status error:", error);
// //         return res.status(500).json({
// //             message: error.message || "Internal server error",
// //             error: true,
// //             success: false
// //         });
// //     }
// // };

// // // Delete order (admin only)
// // export const deleteOrder = async (req, res) => {
// //     try {
// //         const { id } = req.params;

// //         const order = await Order.findByIdAndDelete(id);

// //         if (!order) {
// //             return res.status(404).json({
// //                 message: "Order not found",
// //                 error: true,
// //                 success: false
// //             });
// //         }

// //         return res.json({
// //             message: "Order deleted successfully",
// //             error: false,
// //             success: true
// //         });
// //     } catch (error) {
// //         console.error("Delete order error:", error);
// //         return res.status(500).json({
// //             message: error.message || "Internal server error",
// //             error: true,
// //             success: false
// //         });
// //     }
// // };

// // // Get order statistics (admin only)
// // export const getOrderStats = async (req, res) => {
// //     try {
// //         const totalOrders = await Order.countDocuments();
// //         const pendingOrders = await Order.countDocuments({ order_status: 'pending' });
// //         const deliveredOrders = await Order.countDocuments({ order_status: 'delivered' });
// //         const wholesaleOrders = await Order.countDocuments({ 'items.pricingTier': 'wholesale' });
        
// //         // Get today's orders
// //         const today = new Date();
// //         today.setHours(0, 0, 0, 0);
// //         const todayOrders = await Order.countDocuments({ 
// //             createdAt: { $gte: today } 
// //         });

// //         // Get total revenue
// //         const revenueResult = await Order.aggregate([
// //             { $match: { order_status: 'delivered' } },
// //             { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
// //         ]);
// //         const totalRevenue = revenueResult[0]?.totalRevenue || 0;

// //         return res.json({
// //             message: "Order statistics retrieved successfully",
// //             error: false,
// //             success: true,
// //             data: {
// //                 totalOrders,
// //                 pendingOrders,
// //                 deliveredOrders,
// //                 wholesaleOrders,
// //                 todayOrders,
// //                 totalRevenue: parseFloat(totalRevenue.toFixed(2))
// //             }
// //         });
// //     } catch (error) {
// //         console.error("Get order stats error:", error);
// //         return res.status(500).json({
// //             message: error.message || "Internal server error",
// //             error: true,
// //             success: false
// //         });
// //     }
// // };






// controllers/orderController.js - Updated to match productApi response pattern

// Get all orders (admin only) - following consistent response format
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', status = '', type = '' } = req.query;
        
        // Build filter object
        const filter = {};
        
        if (search) {
            filter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'userId.email': { $regex: search, $options: 'i' } },
                { 'delivery_address.phone': { $regex: search, $options: 'i' } },
                { 'items.name': { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            filter.order_status = status;
        }
        
        if (type === 'wholesale') {
            filter['items.pricingTier'] = 'wholesale';
        } else if (type === 'retail') {
            filter['items.pricingTier'] = 'retail';
        }

        const orders = await Order.find(filter)
            .populate('userId', 'name email')
            .populate('delivery_address')
            .populate('items.productId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(filter);

        // Following the same response pattern as products
        return res.json({
            success: true,
            message: "Orders retrieved successfully",
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalOrders: total,
                ordersPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Get all orders error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

// Update order status (admin only) - consistent response format
export const updateOrderStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status } = req.body;

        const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
        
        if (!validStatuses.includes(order_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { order_status },
            { new: true }
        )
        .populate('userId', 'name email')
        .populate('delivery_address')
        .populate('items.productId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });
    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

// Delete order (admin only) - consistent response format
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndDelete(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.json({
            success: true,
            message: "Order deleted successfully"
        });
    } catch (error) {
        console.error("Delete order error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

// Get order statistics (admin only) - consistent response format
export const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ order_status: 'pending' });
        const deliveredOrders = await Order.countDocuments({ order_status: 'delivered' });
        const wholesaleOrders = await Order.countDocuments({ 'items.pricingTier': 'wholesale' });
        
        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({ 
            createdAt: { $gte: today } 
        });

        // Get total revenue
        const revenueResult = await Order.aggregate([
            { $match: { order_status: 'delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        return res.json({
            success: true,
            message: "Order statistics retrieved successfully",
            data: {
                totalOrders,
                pendingOrders,
                deliveredOrders,
                wholesaleOrders,
                todayOrders,
                totalRevenue: parseFloat(totalRevenue.toFixed(2))
            }
        });
    } catch (error) {
        console.error("Get order stats error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};