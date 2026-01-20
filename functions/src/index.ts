/**
 * Firebase Cloud Functions for Neighborfood
 * 
 * Following best practices:
 * - Authentication (login, register, logout) remains client-side as recommended
 * - Storage uploads remain client-side (requires direct file access)
 * - Firestore read/write operations are handled via Cloud Functions for:
 *   - Better security through server-side validation
 *   - Reduced client-side bundle size
 *   - Centralized business logic
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// =============================================================================
// Type Definitions
// =============================================================================

interface DocumentData {
    [key: string]: unknown;
    id?: string;
    userId?: string;
    createdAt?: FirebaseFirestore.Timestamp;
}

interface GetDocumentRequest {
    collectionPath: string;
    docId: string;
}

interface GetAllDocumentsRequest {
    collectionPath: string;
}

interface GetDocumentsWhereRequest {
    collectionPath: string;
    field: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: unknown;
}

interface AddDocumentRequest {
    collectionPath: string;
    data: DocumentData;
    id?: string | null;
}

interface UpdateDocumentRequest {
    collectionPath: string;
    docId: string;
    data: DocumentData;
}

interface DeleteDocumentRequest {
    collectionPath: string;
    docId: string;
}

interface CreateShopRequest {
    userId: string;
    shopData: DocumentData;
}

interface UpdateShopRequest {
    shopId: string;
    shopData: DocumentData;
}

interface GetShopsAndItemsRequest {
    userId: string;
}

interface GetItemsForShopRequest {
    shopId: string;
}

interface GetShopsForMarketRequest {
    marketId: string;
}

interface GetShopsByZipCodePrefixRequest {
    zipPrefix: string;
    userId: string;
}

interface CreateItemRequest {
    shopId: string;
    itemData: DocumentData;
}

interface UpdateItemQuantityRequest {
    itemId: string;
    quantityChange: number;
}

interface CreateOrderRequest {
    orderData: DocumentData;
}

interface GetOrdersFromUserRequest {
    userId: string;
}

interface GetOrdersForShopRequest {
    shopId: string;
}

interface UpdateOrderStatusRequest {
    orderId: string;
    shopId: string;
    status: string;
}

interface GetOrderRequest {
    orderId: string;
    shopId: string;
}

interface GetUserByIdRequest {
    userId: string;
}

interface GetShopsForUserRequest {
    userId: string;
}

interface GetAllItemsForUserRequest {
    userId: string;
}

interface GetItemByIdRequest {
    itemId: string;
}

interface GetOrdersForUserRequest {
    userId: string;
}

// =============================================================================
// Helper function to verify authentication
// =============================================================================

function verifyAuth(request: CallableRequest): void {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to perform this action');
    }
}

// =============================================================================
// Generic Document Operations
// =============================================================================

/**
 * Get a single document by collection path and document ID
 */
export const getDocument = onCall(async (request: CallableRequest<GetDocumentRequest>) => {
    verifyAuth(request);
    const { collectionPath, docId } = request.data;
    
    if (!collectionPath || !docId) {
        throw new HttpsError('invalid-argument', 'Collection path and document ID are required');
    }

    try {
        const docRef = db.collection(collectionPath).doc(docId);
        const snapshot = await docRef.get();
        
        if (snapshot.exists) {
            return { id: snapshot.id, ...snapshot.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting document:', error);
        throw new HttpsError('internal', 'Error getting document');
    }
});

/**
 * Get all documents from a collection
 */
export const getAllDocuments = onCall(async (request: CallableRequest<GetAllDocumentsRequest>) => {
    verifyAuth(request);
    const { collectionPath } = request.data;
    
    if (!collectionPath) {
        throw new HttpsError('invalid-argument', 'Collection path is required');
    }

    try {
        const collectionRef = db.collection(collectionPath);
        const snapshot = await collectionRef.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting all documents:', error);
        throw new HttpsError('internal', 'Error getting documents');
    }
});

/**
 * Get documents with a where clause
 */
export const getDocumentsWhere = onCall(async (request: CallableRequest<GetDocumentsWhereRequest>) => {
    verifyAuth(request);
    const { collectionPath, field, operator, value } = request.data;
    
    if (!collectionPath || !field || !operator) {
        throw new HttpsError('invalid-argument', 'Collection path, field, and operator are required');
    }

    try {
        const collectionRef = db.collection(collectionPath);
        const q = collectionRef.where(field, operator, value);
        const snapshot = await q.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting documents with condition:', error);
        throw new HttpsError('internal', 'Error getting documents');
    }
});

/**
 * Add a document to a collection
 */
export const addDocument = onCall(async (request: CallableRequest<AddDocumentRequest>) => {
    verifyAuth(request);
    const { collectionPath, data, id } = request.data;
    
    if (!collectionPath || !data) {
        throw new HttpsError('invalid-argument', 'Collection path and data are required');
    }

    try {
        if (id) {
            const docRef = db.collection(collectionPath).doc(id);
            await docRef.set(data);
            return id;
        } else {
            const collectionRef = db.collection(collectionPath);
            const docRef = await collectionRef.add(data);
            return docRef.id;
        }
    } catch (error) {
        console.error('Error adding document:', error);
        throw new HttpsError('internal', 'Error adding document');
    }
});

/**
 * Update a document
 */
export const updateDocument = onCall(async (request: CallableRequest<UpdateDocumentRequest>) => {
    verifyAuth(request);
    const { collectionPath, docId, data } = request.data;
    
    if (!collectionPath || !docId || !data) {
        throw new HttpsError('invalid-argument', 'Collection path, document ID, and data are required');
    }

    try {
        const docRef = db.collection(collectionPath).doc(docId);
        await docRef.update(data);
        return true;
    } catch (error) {
        console.error('Error updating document:', error);
        throw new HttpsError('internal', 'Error updating document');
    }
});

/**
 * Delete a document
 */
export const deleteDocument = onCall(async (request: CallableRequest<DeleteDocumentRequest>) => {
    verifyAuth(request);
    const { collectionPath, docId } = request.data;
    
    if (!collectionPath || !docId) {
        throw new HttpsError('invalid-argument', 'Collection path and document ID are required');
    }

    try {
        const docRef = db.collection(collectionPath).doc(docId);
        await docRef.delete();
        return true;
    } catch (error) {
        console.error('Error deleting document:', error);
        throw new HttpsError('internal', 'Error deleting document');
    }
});

// =============================================================================
// Shop Operations
// =============================================================================

/**
 * Create a shop for a user
 */
export const createShopForUser = onCall(async (request: CallableRequest<CreateShopRequest>) => {
    verifyAuth(request);
    const { userId, shopData } = request.data;
    
    if (!userId || !shopData) {
        throw new HttpsError('invalid-argument', 'User ID and shop data are required');
    }

    // Verify the authenticated user matches the userId
    if (request.auth?.uid !== userId) {
        throw new HttpsError('permission-denied', 'User can only create shops for themselves');
    }

    try {
        const shopsCollectionRef = db.collection('shops');
        const userDocRef = db.doc(`users/${userId}`);
        
        // Create the shop document
        const docRef = await shopsCollectionRef.add(shopData);
        console.log('Shop created with ID:', docRef.id);
        
        const shopDocRef = db.doc(`shops/${docRef.id}`);
        
        // Update the user's 'shops' array with the document reference
        await userDocRef.update({
            shops: FieldValue.arrayUnion(shopDocRef)
        });
        
        console.log("Shop reference added to user's shops array.");
        return docRef.id;
    } catch (error) {
        console.error('Error creating shop or updating user:', error);
        throw new HttpsError('internal', 'Error creating shop');
    }
});

/**
 * Update shop details
 */
export const updateShopDetails = onCall(async (request: CallableRequest<UpdateShopRequest>) => {
    verifyAuth(request);
    const { shopId, shopData } = request.data;
    
    if (!shopId || !shopData) {
        throw new HttpsError('invalid-argument', 'Shop ID and shop data are required');
    }

    try {
        // First verify the user owns this shop
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            throw new HttpsError('not-found', 'Shop not found');
        }
        
        const shopOwner = shopDoc.data()?.userId;
        if (shopOwner !== request.auth?.uid) {
            throw new HttpsError('permission-denied', 'User can only update their own shops');
        }

        const shopDocRef = db.collection('shops').doc(shopId);
        await shopDocRef.update(shopData);
        console.log('Shop updated with ID:', shopId);
        return true;
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error('Error updating shop:', error);
        throw new HttpsError('internal', 'Error updating shop');
    }
});

/**
 * Get shops and items for a user
 */
export const getShopsAndItemsForUser = onCall(async (request: CallableRequest<GetShopsAndItemsRequest>) => {
    verifyAuth(request);
    const { userId } = request.data;
    
    if (!userId) {
        throw new HttpsError('invalid-argument', 'User ID is required');
    }

    // Verify the authenticated user matches the userId
    if (request.auth?.uid !== userId) {
        throw new HttpsError('permission-denied', 'User can only access their own shops and items');
    }

    try {
        // Get shops for the user
        const shopsSnapshot = await db.collection('shops')
            .where('userId', '==', userId)
            .get();
        
        const shops: DocumentData[] = [];
        const shopIds: string[] = [];
        
        shopsSnapshot.forEach((shopDoc) => {
            const shopData = shopDoc.data();
            console.log('Fetching shop:', shopData.name);
            shops.push({ id: shopDoc.id, ...shopData });
            shopIds.push(shopDoc.id);
        });

        // Get items for each shop in parallel
        const items: DocumentData[] = [];
        await Promise.all(shopIds.map(async (shopId) => {
            console.log('Fetching items for shop ID:', shopId);
            const itemsSnapshot = await db.collection('items')
                .where('shopId', '==', shopId)
                .get();
            
            console.log(`Found ${itemsSnapshot.docs.length} items for shop ${shopId}`);
            itemsSnapshot.forEach(itemDoc => {
                console.log('Fetching item:', itemDoc.data().name);
                items.push({ id: itemDoc.id, ...itemDoc.data() });
            });
        }));

        return { shops, items };
    } catch (error) {
        console.error('Error fetching shops and items:', error);
        throw new HttpsError('internal', 'Error fetching shops and items');
    }
});

/**
 * Get items for a shop
 */
export const getItemsForShop = onCall(async (request: CallableRequest<GetItemsForShopRequest>) => {
    verifyAuth(request);
    const { shopId } = request.data;
    
    if (!shopId) {
        throw new HttpsError('invalid-argument', 'Shop ID is required');
    }

    try {
        const itemsSnapshot = await db.collection('items')
            .where('shopId', '==', shopId)
            .get();
        
        return itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching items for shop:', error);
        throw new HttpsError('internal', 'Error fetching items');
    }
});

/**
 * Get shops for a market
 */
export const getShopsForMarket = onCall(async (request: CallableRequest<GetShopsForMarketRequest>) => {
    verifyAuth(request);
    const { marketId } = request.data;
    
    if (!marketId) {
        throw new HttpsError('invalid-argument', 'Market ID is required');
    }

    try {
        const shopsSnapshot = await db.collection('shops')
            .where('marketId', '==', marketId)
            .get();
        
        return shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching shops for market:', error);
        throw new HttpsError('internal', 'Error fetching shops');
    }
});

/**
 * Get shops by ZIP code prefix
 */
export const getShopsByZipCodePrefix = onCall(async (request: CallableRequest<GetShopsByZipCodePrefixRequest>) => {
    verifyAuth(request);
    const { zipPrefix, userId } = request.data;
    
    if (!zipPrefix || !userId) {
        throw new HttpsError('invalid-argument', 'ZIP prefix and user ID are required');
    }

    try {
        const shopsSnapshot = await db.collection('shops')
            .where('marketId', '>=', zipPrefix)
            .where('marketId', '<=', zipPrefix + '\uf8ff')
            .get();
        
        // Filter out the user's own shops
        const shops = shopsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
        return shops.filter(shop => shop.userId !== userId);
    } catch (error) {
        console.error('Error getting shops by zip code prefix:', error);
        throw new HttpsError('internal', 'Error getting shops');
    }
});

/**
 * Get shops for a user
 */
export const getShopsForUser = onCall(async (request: CallableRequest<GetShopsForUserRequest>) => {
    verifyAuth(request);
    const { userId } = request.data;
    
    if (!userId) {
        throw new HttpsError('invalid-argument', 'User ID is required');
    }

    try {
        const shopsSnapshot = await db.collection('shops')
            .where('userId', '==', userId)
            .get();
        
        return shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching shops for user:', error);
        throw new HttpsError('internal', 'Error fetching shops');
    }
});

// =============================================================================
// Item Operations
// =============================================================================

/**
 * Create an item for a shop
 */
export const createItemForShop = onCall(async (request: CallableRequest<CreateItemRequest>) => {
    verifyAuth(request);
    const { shopId, itemData } = request.data;
    
    if (!shopId || !itemData) {
        throw new HttpsError('invalid-argument', 'Shop ID and item data are required');
    }

    try {
        // Verify the user owns this shop
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            throw new HttpsError('not-found', 'Shop not found');
        }
        
        const shopOwner = shopDoc.data()?.userId;
        if (shopOwner !== request.auth?.uid) {
            throw new HttpsError('permission-denied', 'User can only add items to their own shops');
        }

        const itemsCollectionRef = db.collection('items');
        const docRef = await itemsCollectionRef.add({
            ...itemData,
            shopId: shopId, // Store as string - change to array if multi-shop items are needed later
            createdAt: FieldValue.serverTimestamp()
        });
        
        console.log('Item created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error('Error creating item:', error);
        throw new HttpsError('internal', 'Error creating item');
    }
});

/**
 * Get item by ID
 */
export const getItemById = onCall(async (request: CallableRequest<GetItemByIdRequest>) => {
    verifyAuth(request);
    const { itemId } = request.data;
    
    if (!itemId) {
        throw new HttpsError('invalid-argument', 'Item ID is required');
    }

    try {
        const itemDoc = await db.collection('items').doc(itemId).get();
        
        if (itemDoc.exists) {
            return { id: itemDoc.id, ...itemDoc.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching item by ID:', error);
        throw new HttpsError('internal', 'Error fetching item');
    }
});

/**
 * Get all items for a user
 */
export const getAllItemsForUser = onCall(async (request: CallableRequest<GetAllItemsForUserRequest>) => {
    verifyAuth(request);
    const { userId } = request.data;
    
    if (!userId) {
        throw new HttpsError('invalid-argument', 'User ID is required');
    }

    try {
        const itemsSnapshot = await db.collection('items')
            .where('userId', '==', userId)
            .get();
        
        return itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching items for user:', error);
        throw new HttpsError('internal', 'Error fetching items');
    }
});

/**
 * Update item quantity
 */
export const updateItemQuantity = onCall(async (request: CallableRequest<UpdateItemQuantityRequest>) => {
    verifyAuth(request);
    const { itemId, quantityChange } = request.data;
    
    if (!itemId || quantityChange === undefined) {
        throw new HttpsError('invalid-argument', 'Item ID and quantity change are required');
    }

    try {
        const itemDoc = await db.collection('items').doc(itemId).get();
        
        if (!itemDoc.exists) {
            throw new HttpsError('not-found', `Item with ID ${itemId} not found`);
        }

        const itemData = itemDoc.data();
        const currentQuantity = itemData?.quantity || 0;
        const newQuantity = currentQuantity + quantityChange;
        
        // Don't allow negative quantities
        const finalQuantity = newQuantity < 0 ? 0 : newQuantity;
        
        if (newQuantity < 0) {
            console.warn(`Cannot set negative quantity for item ${itemId}. Current: ${currentQuantity}, Change: ${quantityChange}`);
        }

        await db.collection('items').doc(itemId).update({ quantity: finalQuantity });
        console.log(`Updated item ${itemId} quantity: ${currentQuantity} -> ${finalQuantity}`);
        
        return { success: true, newQuantity: finalQuantity };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error('Error updating item quantity:', error);
        throw new HttpsError('internal', 'Error updating item quantity');
    }
});

// =============================================================================
// Order Operations
// =============================================================================

/**
 * Create an order
 */
export const createOrder = onCall(async (request: CallableRequest<CreateOrderRequest>) => {
    verifyAuth(request);
    const { orderData } = request.data;
    
    if (!orderData) {
        throw new HttpsError('invalid-argument', 'Order data is required');
    }

    // Verify the authenticated user matches the userId in the order
    if (orderData.userId && orderData.userId !== request.auth?.uid) {
        throw new HttpsError('permission-denied', 'User can only create orders for themselves');
    }

    try {
        const ordersCollectionRef = db.collection('orders');
        const docRef = await ordersCollectionRef.add({
            ...orderData,
            createdAt: FieldValue.serverTimestamp()
        });
        
        console.log('Order created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        throw new HttpsError('internal', 'Error creating order');
    }
});

/**
 * Get orders from a user (orders placed by user)
 */
export const getOrdersFromUser = onCall(async (request: CallableRequest<GetOrdersFromUserRequest>) => {
    verifyAuth(request);
    const { userId } = request.data;
    
    if (!userId) {
        throw new HttpsError('invalid-argument', 'User ID is required');
    }

    // Verify the authenticated user matches the userId
    if (request.auth?.uid !== userId) {
        throw new HttpsError('permission-denied', 'User can only access their own orders');
    }

    try {
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .get();
        
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
        
        // Sort by creation date, newest first
        return orders.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error('Error fetching orders for user:', error);
        throw new HttpsError('internal', 'Error fetching orders');
    }
});

/**
 * Get orders for a shop
 */
export const getOrdersForShop = onCall(async (request: CallableRequest<GetOrdersForShopRequest>) => {
    verifyAuth(request);
    const { shopId } = request.data;
    
    if (!shopId) {
        throw new HttpsError('invalid-argument', 'Shop ID is required');
    }

    try {
        // Verify the user owns this shop
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            throw new HttpsError('not-found', 'Shop not found');
        }
        
        const shopOwner = shopDoc.data()?.userId;
        if (shopOwner !== request.auth?.uid) {
            throw new HttpsError('permission-denied', 'User can only access orders for their own shops');
        }

        const ordersSnapshot = await db.collection('orders')
            .where('shopId', '==', shopId)
            .get();
        
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
        
        // Sort by creation date, newest first
        return orders.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error('Error fetching orders for shop:', error);
        throw new HttpsError('internal', 'Error fetching orders');
    }
});

/**
 * Update order status
 */
export const updateOrderStatus = onCall(async (request: CallableRequest<UpdateOrderStatusRequest>) => {
    verifyAuth(request);
    const { orderId, shopId, status } = request.data;
    
    if (!orderId || !shopId || !status) {
        throw new HttpsError('invalid-argument', 'Order ID, shop ID, and status are required');
    }

    try {
        // Find the order
        const ordersSnapshot = await db.collection('orders')
            .where('id', '==', orderId)
            .where('shopId', '==', shopId)
            .get();
        
        if (ordersSnapshot.empty) {
            throw new HttpsError('not-found', 'Order not found');
        }
        
        const orderDoc = ordersSnapshot.docs[0];
        const orderData = orderDoc.data();
        
        // Verify user has permission (either shop owner or the customer)
        const shopDoc = await db.collection('shops').doc(shopId).get();
        const shopOwner = shopDoc.data()?.userId;
        const isShopOwner = shopOwner === request.auth?.uid;
        const isCustomer = orderData.userId === request.auth?.uid;
        
        if (!isShopOwner && !isCustomer) {
            throw new HttpsError('permission-denied', 'User can only update orders for their own shops or their own orders');
        }

        await orderDoc.ref.update({
            status,
            updatedAt: FieldValue.serverTimestamp()
        });
        
        console.log('Order status updated:', orderId, status);
        return true;
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error('Error updating order status:', error);
        throw new HttpsError('internal', 'Error updating order status');
    }
});

/**
 * Get comprehensive orders for a user (both placed and received)
 */
export const getOrdersForUser = onCall(async (request: CallableRequest<GetOrdersForUserRequest>) => {
    verifyAuth(request);
    const { userId } = request.data;
    
    if (!userId) {
        throw new HttpsError('invalid-argument', 'User ID is required');
    }

    // Verify the authenticated user matches the userId
    if (request.auth?.uid !== userId) {
        throw new HttpsError('permission-denied', 'User can only access their own orders');
    }

    try {
        // Get orders placed by the user (as customer)
        const placedOrdersSnapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .get();
        
        const placedOrders = placedOrdersSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        } as DocumentData));

        // Get orders received by the user's shops (as shop owner)
        const userShopsSnapshot = await db.collection('shops')
            .where('userId', '==', userId)
            .get();
        
        const shopIds = userShopsSnapshot.docs.map(doc => doc.id);
        
        const receivedOrders: DocumentData[] = [];
        
        // Get orders for all user's shops in parallel
        await Promise.all(shopIds.map(async (shopId) => {
            const shopOrdersSnapshot = await db.collection('orders')
                .where('shopId', '==', shopId)
                .get();
            
            shopOrdersSnapshot.forEach(orderDoc => {
                receivedOrders.push({
                    id: orderDoc.id,
                    ...orderDoc.data(),
                    shopOwnerView: true
                } as DocumentData);
            });
        }));

        // Combine and sort all orders by creation date
        const allOrders = [...placedOrders, ...receivedOrders].sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });

        // Sort individual arrays as well
        placedOrders.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });

        receivedOrders.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });

        return {
            placedOrders,
            receivedOrders,
            allOrders
        };
    } catch (error) {
        console.error('Error fetching comprehensive orders for user:', error);
        throw new HttpsError('internal', 'Error fetching orders');
    }
});

/**
 * Get a specific order
 */
export const getOrder = onCall(async (request: CallableRequest<GetOrderRequest>) => {
    verifyAuth(request);
    const { orderId, shopId } = request.data;
    
    if (!orderId || !shopId) {
        throw new HttpsError('invalid-argument', 'Order ID and shop ID are required');
    }

    try {
        const ordersSnapshot = await db.collection('orders')
            .where('id', '==', orderId)
            .where('shopId', '==', shopId)
            .get();
        
        if (ordersSnapshot.empty) {
            throw new HttpsError('not-found', 'Order not found');
        }
        
        const orderDoc = ordersSnapshot.docs[0];
        const orderData = orderDoc.data();
        
        // Verify user has permission (either shop owner or the customer)
        const shopDoc = await db.collection('shops').doc(shopId).get();
        const shopOwner = shopDoc.data()?.userId;
        const isShopOwner = shopOwner === request.auth?.uid;
        const isCustomer = orderData.userId === request.auth?.uid;
        
        if (!isShopOwner && !isCustomer) {
            throw new HttpsError('permission-denied', 'User can only access their own orders or orders for their shops');
        }

        return { 
            id: orderDoc.id, 
            ...orderData 
        };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error('Error fetching order:', error);
        throw new HttpsError('internal', 'Error fetching order');
    }
});

// =============================================================================
// User Operations
// =============================================================================

/**
 * Get user by ID
 */
export const getUserById = onCall(async (request: CallableRequest<GetUserByIdRequest>) => {
    verifyAuth(request);
    const { userId } = request.data;
    
    if (!userId) {
        throw new HttpsError('invalid-argument', 'User ID is required');
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            return { id: userDoc.id, ...userDoc.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw new HttpsError('internal', 'Error fetching user');
    }
});
