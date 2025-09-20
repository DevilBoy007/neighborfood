"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getOrdersForShop = exports.getOrdersFromUser = exports.createOrder = exports.getAllItemsForUser = exports.createItemForShop = exports.getItemsForShop = exports.updateShopDetails = exports.createShopForUser = exports.getShopsByZipCodePrefix = exports.getShopsForUser = exports.getUserById = exports.registerUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
// Utility function to validate authentication
const validateAuth = async (token) => {
    if (!token) {
        throw new https_1.HttpsError("unauthenticated", "No authentication token provided");
    }
    try {
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken;
    }
    catch (error) {
        throw new https_1.HttpsError("unauthenticated", "Invalid authentication token");
    }
};
// Utility function to sanitize input
const sanitizeInput = (input) => {
    if (typeof input === "string") {
        return input.trim();
    }
    if (typeof input === "object" && input !== null) {
        const sanitized = {};
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                sanitized[key] = sanitizeInput(input[key]);
            }
        }
        return sanitized;
    }
    return input;
};
// Authentication Functions
exports.registerUser = (0, https_1.onCall)(async (request) => {
    try {
        const { email, password, username, userData } = sanitizeInput(request.data);
        if (!email || !password || !username) {
            throw new https_1.HttpsError("invalid-argument", "Email, password, and username are required");
        }
        // Check if username is already taken
        const usersQuery = await db.collection("users").where("username", "==", username).get();
        if (!usersQuery.empty) {
            throw new https_1.HttpsError("already-exists", "Username already taken");
        }
        // Create user account
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: username,
        });
        // Store additional user data in Firestore
        await db.collection("users").doc(userRecord.uid).set(Object.assign(Object.assign({}, sanitizeInput(userData)), { username,
            email, createdAt: new Date() }));
        return {
            success: true,
            userId: userRecord.uid,
            message: "User registered successfully",
        };
    }
    catch (error) {
        console.error("Error registering user:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to register user");
    }
});
// User Functions
exports.getUserById = (0, https_1.onCall)(async (request) => {
    try {
        const { userId, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        // Users can only access their own data or we need additional authorization
        if (decodedToken.uid !== userId) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError("not-found", "User not found");
        }
        return {
            success: true,
            data: Object.assign({ id: userDoc.id }, userDoc.data()),
        };
    }
    catch (error) {
        console.error("Error getting user:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to get user");
    }
});
// Shop Functions
exports.getShopsForUser = (0, https_1.onCall)(async (request) => {
    try {
        const { userId, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        // Users can only access their own shops
        if (decodedToken.uid !== userId) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        const shopsQuery = await db.collection("shops").where("userId", "==", userId).get();
        const shops = [];
        shopsQuery.forEach((doc) => {
            shops.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return {
            success: true,
            data: shops,
        };
    }
    catch (error) {
        console.error("Error getting shops for user:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to get shops");
    }
});
exports.getShopsByZipCodePrefix = (0, https_1.onCall)(async (request) => {
    try {
        const { zipPrefix, userId, authToken } = sanitizeInput(request.data);
        // Validate authentication
        await validateAuth(authToken);
        if (!zipPrefix) {
            throw new https_1.HttpsError("invalid-argument", "ZIP code prefix is required");
        }
        const shopsQuery = await db.collection("shops")
            .where("marketId", ">=", zipPrefix)
            .where("marketId", "<=", zipPrefix + "\uf8ff")
            .get();
        const shops = [];
        shopsQuery.forEach((doc) => {
            const shopData = doc.data();
            // Filter out user's own shops
            if (shopData.userId !== userId) {
                shops.push(Object.assign({ id: doc.id }, shopData));
            }
        });
        return {
            success: true,
            data: shops,
        };
    }
    catch (error) {
        console.error("Error getting shops by zip:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to get shops by ZIP code");
    }
});
exports.createShopForUser = (0, https_1.onCall)(async (request) => {
    try {
        const { userId, shopData, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        // Users can only create shops for themselves
        if (decodedToken.uid !== userId) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        if (!shopData) {
            throw new https_1.HttpsError("invalid-argument", "Shop data is required");
        }
        // Create shop document
        const shopRef = await db.collection("shops").add(Object.assign(Object.assign({}, sanitizeInput(shopData)), { userId, createdAt: new Date() }));
        // Update user's shops array
        await db.collection("users").doc(userId).update({
            shops: db.collection("shops").doc(shopRef.id),
        });
        return {
            success: true,
            shopId: shopRef.id,
            message: "Shop created successfully",
        };
    }
    catch (error) {
        console.error("Error creating shop:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to create shop");
    }
});
exports.updateShopDetails = (0, https_1.onCall)(async (request) => {
    try {
        const { shopId, shopData, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        if (!shopId || !shopData) {
            throw new https_1.HttpsError("invalid-argument", "Shop ID and data are required");
        }
        // Verify user owns this shop
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            throw new https_1.HttpsError("not-found", "Shop not found");
        }
        const shop = shopDoc.data();
        if ((shop === null || shop === void 0 ? void 0 : shop.userId) !== decodedToken.uid) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        // Update shop
        await db.collection("shops").doc(shopId).update(Object.assign(Object.assign({}, sanitizeInput(shopData)), { updatedAt: new Date() }));
        return {
            success: true,
            message: "Shop updated successfully",
        };
    }
    catch (error) {
        console.error("Error updating shop:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to update shop");
    }
});
// Item Functions
exports.getItemsForShop = (0, https_1.onCall)(async (request) => {
    try {
        const { shopId, authToken } = sanitizeInput(request.data);
        // Validate authentication
        await validateAuth(authToken);
        if (!shopId) {
            throw new https_1.HttpsError("invalid-argument", "Shop ID is required");
        }
        const itemsQuery = await db.collection("items").where("shopId", "==", shopId).get();
        const items = [];
        itemsQuery.forEach((doc) => {
            items.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return {
            success: true,
            data: items,
        };
    }
    catch (error) {
        console.error("Error getting items for shop:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to get items");
    }
});
exports.createItemForShop = (0, https_1.onCall)(async (request) => {
    try {
        const { shopId, itemData, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        if (!shopId || !itemData) {
            throw new https_1.HttpsError("invalid-argument", "Shop ID and item data are required");
        }
        // Verify user owns this shop
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            throw new https_1.HttpsError("not-found", "Shop not found");
        }
        const shop = shopDoc.data();
        if ((shop === null || shop === void 0 ? void 0 : shop.userId) !== decodedToken.uid) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        // Create item
        const itemRef = await db.collection("items").add(Object.assign(Object.assign({}, sanitizeInput(itemData)), { shopId: [shopId], createdAt: new Date() }));
        return {
            success: true,
            itemId: itemRef.id,
            message: "Item created successfully",
        };
    }
    catch (error) {
        console.error("Error creating item:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to create item");
    }
});
exports.getAllItemsForUser = (0, https_1.onCall)(async (request) => {
    try {
        const { userId, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        // Users can only access their own items
        if (decodedToken.uid !== userId) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        const itemsQuery = await db.collection("items").where("userId", "==", userId).get();
        const items = [];
        itemsQuery.forEach((doc) => {
            items.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return {
            success: true,
            data: items,
        };
    }
    catch (error) {
        console.error("Error getting items for user:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to get items");
    }
});
// Order Functions
exports.createOrder = (0, https_1.onCall)(async (request) => {
    try {
        const { orderData, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        if (!orderData) {
            throw new https_1.HttpsError("invalid-argument", "Order data is required");
        }
        // Ensure the order belongs to the authenticated user
        const sanitizedOrderData = Object.assign(Object.assign({}, sanitizeInput(orderData)), { userId: decodedToken.uid, createdAt: new Date() });
        const orderRef = await db.collection("orders").add(sanitizedOrderData);
        return {
            success: true,
            orderId: orderRef.id,
            message: "Order created successfully",
        };
    }
    catch (error) {
        console.error("Error creating order:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to create order");
    }
});
exports.getOrdersFromUser = (0, https_1.onCall)(async (request) => {
    try {
        const { userId, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        // Users can only access their own orders
        if (decodedToken.uid !== userId) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        const ordersQuery = await db.collection("orders").where("userId", "==", userId).get();
        const orders = [];
        ordersQuery.forEach((doc) => {
            orders.push(Object.assign({ id: doc.id }, doc.data()));
        });
        // Sort by creation date, newest first
        orders.sort((a, b) => {
            var _a, _b;
            const aTime = ((_a = a.createdAt) === null || _a === void 0 ? void 0 : _a.seconds) || 0;
            const bTime = ((_b = b.createdAt) === null || _b === void 0 ? void 0 : _b.seconds) || 0;
            return bTime - aTime;
        });
        return {
            success: true,
            data: orders,
        };
    }
    catch (error) {
        console.error("Error getting orders for user:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to get orders");
    }
});
exports.getOrdersForShop = (0, https_1.onCall)(async (request) => {
    try {
        const { shopId, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        if (!shopId) {
            throw new https_1.HttpsError("invalid-argument", "Shop ID is required");
        }
        // Verify user owns this shop
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            throw new https_1.HttpsError("not-found", "Shop not found");
        }
        const shop = shopDoc.data();
        if ((shop === null || shop === void 0 ? void 0 : shop.userId) !== decodedToken.uid) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        const ordersQuery = await db.collection("orders").where("shopId", "==", shopId).get();
        const orders = [];
        ordersQuery.forEach((doc) => {
            orders.push(Object.assign({ id: doc.id }, doc.data()));
        });
        // Sort by creation date, newest first
        orders.sort((a, b) => {
            var _a, _b;
            const aTime = ((_a = a.createdAt) === null || _a === void 0 ? void 0 : _a.seconds) || 0;
            const bTime = ((_b = b.createdAt) === null || _b === void 0 ? void 0 : _b.seconds) || 0;
            return bTime - aTime;
        });
        return {
            success: true,
            data: orders,
        };
    }
    catch (error) {
        console.error("Error getting orders for shop:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to get orders for shop");
    }
});
exports.updateOrderStatus = (0, https_1.onCall)(async (request) => {
    try {
        const { orderId, shopId, status, authToken } = sanitizeInput(request.data);
        // Validate authentication
        const decodedToken = await validateAuth(authToken);
        if (!orderId || !shopId || !status) {
            throw new https_1.HttpsError("invalid-argument", "Order ID, shop ID, and status are required");
        }
        // Verify user owns the shop
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            throw new https_1.HttpsError("not-found", "Shop not found");
        }
        const shop = shopDoc.data();
        if ((shop === null || shop === void 0 ? void 0 : shop.userId) !== decodedToken.uid) {
            throw new https_1.HttpsError("permission-denied", "Unauthorized access");
        }
        // Find and update the order
        const ordersQuery = await db.collection("orders")
            .where("id", "==", orderId)
            .where("shopId", "==", shopId)
            .get();
        if (ordersQuery.empty) {
            throw new https_1.HttpsError("not-found", "Order not found");
        }
        const orderDoc = ordersQuery.docs[0];
        await orderDoc.ref.update({
            status,
            updatedAt: new Date(),
        });
        return {
            success: true,
            message: "Order status updated successfully",
        };
    }
    catch (error) {
        console.error("Error updating order status:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to update order status");
    }
});
//# sourceMappingURL=index.js.map