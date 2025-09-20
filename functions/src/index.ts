import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

// Utility function to validate authentication
const validateAuth = async (token: string) => {
  if (!token) {
    throw new HttpsError("unauthenticated", "No authentication token provided");
  }
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new HttpsError("unauthenticated", "Invalid authentication token");
  }
};

// Utility function to sanitize input
const sanitizeInput = (input: any): any => {
  if (typeof input === "string") {
    return input.trim();
  }
  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
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
export const registerUser = onCall(async (request) => {
  try {
    const {email, password, username, userData} = sanitizeInput(request.data);
    
    if (!email || !password || !username) {
      throw new HttpsError("invalid-argument", "Email, password, and username are required");
    }

    // Check if username is already taken
    const usersQuery = await db.collection("users").where("username", "==", username).get();
    if (!usersQuery.empty) {
      throw new HttpsError("already-exists", "Username already taken");
    }

    // Create user account
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    });

    // Store additional user data in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      ...sanitizeInput(userData),
      username,
      email,
      createdAt: new Date(),
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: "User registered successfully",
    };
  } catch (error) {
    console.error("Error registering user:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to register user");
  }
});

// User Functions
export const getUserById = onCall(async (request) => {
  try {
    const {userId, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);
    
    // Users can only access their own data or we need additional authorization
    if (decodedToken.uid !== userId) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    return {
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    };
  } catch (error) {
    console.error("Error getting user:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to get user");
  }
});

// Shop Functions
export const getShopsForUser = onCall(async (request) => {
  try {
    const {userId, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);
    
    // Users can only access their own shops
    if (decodedToken.uid !== userId) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    const shopsQuery = await db.collection("shops").where("userId", "==", userId).get();
    const shops: any[] = [];
    
    shopsQuery.forEach((doc) => {
      shops.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: shops,
    };
  } catch (error) {
    console.error("Error getting shops for user:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to get shops");
  }
});

export const getShopsByZipCodePrefix = onCall(async (request) => {
  try {
    const {zipPrefix, userId, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    await validateAuth(authToken);

    if (!zipPrefix) {
      throw new HttpsError("invalid-argument", "ZIP code prefix is required");
    }

    const shopsQuery = await db.collection("shops")
      .where("marketId", ">=", zipPrefix)
      .where("marketId", "<=", zipPrefix + "\uf8ff")
      .get();
    
    const shops: any[] = [];
    shopsQuery.forEach((doc) => {
      const shopData = doc.data();
      // Filter out user's own shops
      if (shopData.userId !== userId) {
        shops.push({
          id: doc.id,
          ...shopData,
        });
      }
    });

    return {
      success: true,
      data: shops,
    };
  } catch (error) {
    console.error("Error getting shops by zip:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to get shops by ZIP code");
  }
});

export const createShopForUser = onCall(async (request) => {
  try {
    const {userId, shopData, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);
    
    // Users can only create shops for themselves
    if (decodedToken.uid !== userId) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    if (!shopData) {
      throw new HttpsError("invalid-argument", "Shop data is required");
    }

    // Create shop document
    const shopRef = await db.collection("shops").add({
      ...sanitizeInput(shopData),
      userId,
      createdAt: new Date(),
    });

    // Update user's shops array
    await db.collection("users").doc(userId).update({
      shops: db.collection("shops").doc(shopRef.id),
    });

    return {
      success: true,
      shopId: shopRef.id,
      message: "Shop created successfully",
    };
  } catch (error) {
    console.error("Error creating shop:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to create shop");
  }
});

export const updateShopDetails = onCall(async (request) => {
  try {
    const {shopId, shopData, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);

    if (!shopId || !shopData) {
      throw new HttpsError("invalid-argument", "Shop ID and data are required");
    }

    // Verify user owns this shop
    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) {
      throw new HttpsError("not-found", "Shop not found");
    }

    const shop = shopDoc.data();
    if (shop?.userId !== decodedToken.uid) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    // Update shop
    await db.collection("shops").doc(shopId).update({
      ...sanitizeInput(shopData),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Shop updated successfully",
    };
  } catch (error) {
    console.error("Error updating shop:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to update shop");
  }
});

// Item Functions
export const getItemsForShop = onCall(async (request) => {
  try {
    const {shopId, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    await validateAuth(authToken);

    if (!shopId) {
      throw new HttpsError("invalid-argument", "Shop ID is required");
    }

    const itemsQuery = await db.collection("items").where("shopId", "==", shopId).get();
    const items: any[] = [];
    
    itemsQuery.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    console.error("Error getting items for shop:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to get items");
  }
});

export const createItemForShop = onCall(async (request) => {
  try {
    const {shopId, itemData, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);

    if (!shopId || !itemData) {
      throw new HttpsError("invalid-argument", "Shop ID and item data are required");
    }

    // Verify user owns this shop
    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) {
      throw new HttpsError("not-found", "Shop not found");
    }

    const shop = shopDoc.data();
    if (shop?.userId !== decodedToken.uid) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    // Create item
    const itemRef = await db.collection("items").add({
      ...sanitizeInput(itemData),
      shopId: [shopId], // Store as array for potential multi-shop items
      createdAt: new Date(),
    });

    return {
      success: true,
      itemId: itemRef.id,
      message: "Item created successfully",
    };
  } catch (error) {
    console.error("Error creating item:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to create item");
  }
});

export const getAllItemsForUser = onCall(async (request) => {
  try {
    const {userId, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);
    
    // Users can only access their own items
    if (decodedToken.uid !== userId) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    const itemsQuery = await db.collection("items").where("userId", "==", userId).get();
    const items: any[] = [];
    
    itemsQuery.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    console.error("Error getting items for user:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to get items");
  }
});

// Order Functions
export const createOrder = onCall(async (request) => {
  try {
    const {orderData, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);

    if (!orderData) {
      throw new HttpsError("invalid-argument", "Order data is required");
    }

    // Ensure the order belongs to the authenticated user
    const sanitizedOrderData = {
      ...sanitizeInput(orderData),
      userId: decodedToken.uid,
      createdAt: new Date(),
    };

    const orderRef = await db.collection("orders").add(sanitizedOrderData);

    return {
      success: true,
      orderId: orderRef.id,
      message: "Order created successfully",
    };
  } catch (error) {
    console.error("Error creating order:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to create order");
  }
});

export const getOrdersFromUser = onCall(async (request) => {
  try {
    const {userId, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);
    
    // Users can only access their own orders
    if (decodedToken.uid !== userId) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    const ordersQuery = await db.collection("orders").where("userId", "==", userId).get();
    const orders: any[] = [];
    
    ordersQuery.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by creation date, newest first
    orders.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("Error getting orders for user:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to get orders");
  }
});

export const getOrdersForShop = onCall(async (request) => {
  try {
    const {shopId, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);

    if (!shopId) {
      throw new HttpsError("invalid-argument", "Shop ID is required");
    }

    // Verify user owns this shop
    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) {
      throw new HttpsError("not-found", "Shop not found");
    }

    const shop = shopDoc.data();
    if (shop?.userId !== decodedToken.uid) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    const ordersQuery = await db.collection("orders").where("shopId", "==", shopId).get();
    const orders: any[] = [];
    
    ordersQuery.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by creation date, newest first
    orders.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("Error getting orders for shop:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to get orders for shop");
  }
});

export const updateOrderStatus = onCall(async (request) => {
  try {
    const {orderId, shopId, status, authToken} = sanitizeInput(request.data);
    
    // Validate authentication
    const decodedToken = await validateAuth(authToken);

    if (!orderId || !shopId || !status) {
      throw new HttpsError("invalid-argument", "Order ID, shop ID, and status are required");
    }

    // Verify user owns the shop
    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) {
      throw new HttpsError("not-found", "Shop not found");
    }

    const shop = shopDoc.data();
    if (shop?.userId !== decodedToken.uid) {
      throw new HttpsError("permission-denied", "Unauthorized access");
    }

    // Find and update the order
    const ordersQuery = await db.collection("orders")
      .where("id", "==", orderId)
      .where("shopId", "==", shopId)
      .get();

    if (ordersQuery.empty) {
      throw new HttpsError("not-found", "Order not found");
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
  } catch (error) {
    console.error("Error updating order status:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to update order status");
  }
});