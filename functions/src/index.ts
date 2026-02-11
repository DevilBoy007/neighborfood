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
// Helper functions to convert Firestore data to JSON-serializable format
// This prevents "Maximum call stack size exceeded" errors during serialization
// =============================================================================

interface SanitizedTimestamp {
  seconds: number;
  nanoseconds: number;
}

function getTimestampSeconds(timestamp: unknown): number {
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return (timestamp as SanitizedTimestamp).seconds || 0;
  }
  return 0;
}

function sanitizeFirestoreData(
  data: FirebaseFirestore.DocumentData | undefined | null
): Record<string, unknown> {
  if (!data) return {};

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    result[key] = sanitizeValue(value, new WeakSet());
  }

  return result;
}

function sanitizeValue(value: unknown, visited: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Firestore Timestamp
  if (value instanceof admin.firestore.Timestamp) {
    return {
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    };
  }

  // Handle Firestore DocumentReference - convert to path string
  if (value instanceof admin.firestore.DocumentReference) {
    return value.path;
  }

  // Handle Firestore GeoPoint
  if (value instanceof admin.firestore.GeoPoint) {
    return {
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, visited));
  }

  // Handle plain objects (but not special Firestore types)
  if (typeof value === 'object' && value !== null) {
    // Prevent circular reference infinite recursion
    if (visited.has(value)) {
      return '[Circular Reference]';
    }
    visited.add(value);

    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeValue(v, visited);
    }
    return result;
  }

  // Return primitive values as-is
  return value;
}

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

interface GetShopsWithItemsRequest {
  zipPrefix: string;
  userId: string;
}

interface CreateItemRequest {
  shopId: string;
  itemData: DocumentData;
  itemId?: string; // Optional: if provided, use as document ID
}

interface UpdateItemQuantityRequest {
  itemId: string;
  quantityChange: number;
}

interface UpdateItemDetailsRequest {
  itemId: string;
  itemData: DocumentData;
}

interface DeleteItemRequest {
  itemId: string;
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
      return { id: snapshot.id, ...sanitizeFirestoreData(snapshot.data()) };
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
  } catch (error) {
    console.error('Error getting all documents:', error);
    throw new HttpsError('internal', 'Error getting documents');
  }
});

/**
 * Get documents with a where clause
 */
export const getDocumentsWhere = onCall(
  async (request: CallableRequest<GetDocumentsWhereRequest>) => {
    verifyAuth(request);
    const { collectionPath, field, operator, value } = request.data;

    if (!collectionPath || !field || !operator) {
      throw new HttpsError('invalid-argument', 'Collection path, field, and operator are required');
    }

    try {
      const collectionRef = db.collection(collectionPath);
      const q = collectionRef.where(field, operator, value);
      const snapshot = await q.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
    } catch (error) {
      console.error('Error getting documents with condition:', error);
      throw new HttpsError('internal', 'Error getting documents');
    }
  }
);

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
      shops: FieldValue.arrayUnion(shopDocRef),
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
export const getShopsAndItemsForUser = onCall(
  async (request: CallableRequest<GetShopsAndItemsRequest>) => {
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
      const shopsSnapshot = await db.collection('shops').where('userId', '==', userId).get();

      const shops: DocumentData[] = [];
      const shopIds: string[] = [];

      shopsSnapshot.forEach((shopDoc) => {
        const shopData = shopDoc.data();
        console.log('Fetching shop:', shopData.name);
        shops.push({ id: shopDoc.id, ...sanitizeFirestoreData(shopData) });
        shopIds.push(shopDoc.id);
      });

      // Get items for each shop in parallel
      const items: DocumentData[] = [];
      await Promise.all(
        shopIds.map(async (shopId) => {
          console.log('Fetching items for shop ID:', shopId);
          const itemsSnapshot = await db.collection('items').where('shopId', '==', shopId).get();

          console.log(`Found ${itemsSnapshot.docs.length} items for shop ${shopId}`);
          itemsSnapshot.forEach((itemDoc) => {
            console.log('Fetching item:', itemDoc.data().name);
            items.push({ id: itemDoc.id, ...sanitizeFirestoreData(itemDoc.data()) });
          });
        })
      );

      return { shops, items };
    } catch (error) {
      console.error('Error fetching shops and items:', error);
      throw new HttpsError('internal', 'Error fetching shops and items');
    }
  }
);

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
    const itemsSnapshot = await db.collection('items').where('shopId', '==', shopId).get();

    return itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
  } catch (error) {
    console.error('Error fetching items for shop:', error);
    throw new HttpsError('internal', 'Error fetching items');
  }
});

/**
 * Get shops for a market
 */
export const getShopsForMarket = onCall(
  async (request: CallableRequest<GetShopsForMarketRequest>) => {
    verifyAuth(request);
    const { marketId } = request.data;

    if (!marketId) {
      throw new HttpsError('invalid-argument', 'Market ID is required');
    }

    try {
      const shopsSnapshot = await db.collection('shops').where('marketId', '==', marketId).get();

      return shopsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...sanitizeFirestoreData(doc.data()),
      }));
    } catch (error) {
      console.error('Error fetching shops for market:', error);
      throw new HttpsError('internal', 'Error fetching shops');
    }
  }
);

/**
 * Get shops by ZIP code prefix
 */
export const getShopsByZipCodePrefix = onCall(
  async (request: CallableRequest<GetShopsByZipCodePrefixRequest>) => {
    verifyAuth(request);
    const { zipPrefix, userId } = request.data;

    if (!zipPrefix || !userId) {
      throw new HttpsError('invalid-argument', 'ZIP prefix and user ID are required');
    }

    try {
      const shopsSnapshot = await db
        .collection('shops')
        .where('marketId', '>=', zipPrefix)
        .where('marketId', '<=', zipPrefix + '\uf8ff')
        .get();

      // Filter out the user's own shops
      const shops = shopsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }) as DocumentData
      );
      return shops.filter((shop) => shop.userId !== userId);
    } catch (error) {
      console.error('Error getting shops by zip code prefix:', error);
      throw new HttpsError('internal', 'Error getting shops');
    }
  }
);

/**
 * Get shops with their items in a single call (batch operation)
 * This reduces the number of function calls from N+1 to 1
 */
export const getShopsWithItems = onCall(
  async (request: CallableRequest<GetShopsWithItemsRequest>) => {
    verifyAuth(request);
    const { zipPrefix, userId } = request.data;

    if (!zipPrefix || !userId) {
      throw new HttpsError('invalid-argument', 'ZIP prefix and user ID are required');
    }

    try {
      // Get all shops matching the zip prefix (excluding user's own shops)
      const shopsSnapshot = await db
        .collection('shops')
        .where('marketId', '>=', zipPrefix)
        .where('marketId', '<=', zipPrefix + '\uf8ff')
        .get();

      const shops = shopsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }) as DocumentData)
        .filter((shop) => shop.userId !== userId);

      if (shops.length === 0) {
        return [];
      }

      // Get all items for all shops in a single query using 'in' operator
      // Firestore 'in' supports up to 30 values, so we batch if needed
      const shopIds = shops.map((shop) => shop.id as string);
      const itemsByShopId: Record<string, DocumentData[]> = {};

      // Initialize empty arrays for each shop
      shopIds.forEach((id) => {
        itemsByShopId[id] = [];
      });

      // Batch shop IDs into groups of 30 (Firestore 'in' limit)
      const batchSize = 30;
      for (let i = 0; i < shopIds.length; i += batchSize) {
        const batchIds = shopIds.slice(i, i + batchSize);
        const itemsSnapshot = await db.collection('items').where('shopId', 'in', batchIds).get();

        itemsSnapshot.docs.forEach((doc) => {
          const itemData = sanitizeFirestoreData(doc.data());
          const item = { id: doc.id, ...itemData } as DocumentData;
          const shopId = item.shopId as string;
          if (shopId && itemsByShopId[shopId]) {
            itemsByShopId[shopId].push(item);
          }
        });
      }

      // Attach items to each shop
      const shopsWithItems = shops.map((shop) => ({
        ...shop,
        items: itemsByShopId[shop.id as string] || [],
      }));

      return shopsWithItems;
    } catch (error) {
      console.error('Error getting shops with items:', error);
      throw new HttpsError('internal', 'Error getting shops with items');
    }
  }
);

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
    const shopsSnapshot = await db.collection('shops').where('userId', '==', userId).get();

    return shopsSnapshot.docs.map((doc) => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }));
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
  const { shopId, itemData, itemId } = request.data;

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
    const dataToSave = {
      ...itemData,
      shopId: shopId,
      createdAt: FieldValue.serverTimestamp(),
    };

    let finalId: string;
    if (itemId) {
      // Use provided itemId as document ID (for storage path consistency)
      await itemsCollectionRef.doc(itemId).set(dataToSave);
      finalId = itemId;
    } else {
      // Auto-generate ID
      const docRef = await itemsCollectionRef.add(dataToSave);
      finalId = docRef.id;
    }

    console.log('Item created with ID:', finalId);
    return finalId;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error creating item:', error);
    throw new HttpsError('internal', 'Error creating item');
  }
});

/**
 * Delete an item
 */
export const deleteItem = onCall(async (request: CallableRequest<DeleteItemRequest>) => {
  verifyAuth(request);
  const { itemId } = request.data;

  if (!itemId) {
    throw new HttpsError('invalid-argument', 'Item ID is required');
  }

  try {
    const itemDoc = await db.collection('items').doc(itemId).get();

    if (!itemDoc.exists) {
      throw new HttpsError('not-found', `Item with ID ${itemId} not found`);
    }

    const itemData = itemDoc.data();

    // Verify user owns this item
    if (itemData?.userId !== request.auth?.uid) {
      throw new HttpsError('permission-denied', 'User can only delete their own items');
    }

    await db.collection('items').doc(itemId).delete();
    console.log(`Deleted item ${itemId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error deleting item:', error);
    throw new HttpsError('internal', 'Error deleting item');
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
      return { id: itemDoc.id, ...sanitizeFirestoreData(itemDoc.data()) };
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
export const getAllItemsForUser = onCall(
  async (request: CallableRequest<GetAllItemsForUserRequest>) => {
    verifyAuth(request);
    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    try {
      const itemsSnapshot = await db.collection('items').where('userId', '==', userId).get();

      return itemsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...sanitizeFirestoreData(doc.data()),
      }));
    } catch (error) {
      console.error('Error fetching items for user:', error);
      throw new HttpsError('internal', 'Error fetching items');
    }
  }
);

/**
 * Update item quantity
 */
export const updateItemQuantity = onCall(
  async (request: CallableRequest<UpdateItemQuantityRequest>) => {
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
        console.warn(
          `Cannot set negative quantity for item ${itemId}. Current: ${currentQuantity}, Change: ${quantityChange}`
        );
      }

      await db.collection('items').doc(itemId).update({ quantity: finalQuantity });
      console.log(`Updated item ${itemId} quantity: ${currentQuantity} -> ${finalQuantity}`);

      return { success: true, newQuantity: finalQuantity };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('Error updating item quantity:', error);
      throw new HttpsError('internal', 'Error updating item quantity');
    }
  }
);

/**
 * Update item details (e.g., shopId array, name, price, etc.)
 */
export const updateItemDetails = onCall(
  async (request: CallableRequest<UpdateItemDetailsRequest>) => {
    verifyAuth(request);
    const { itemId, itemData } = request.data;

    if (!itemId || !itemData) {
      throw new HttpsError('invalid-argument', 'Item ID and item data are required');
    }

    try {
      const itemDoc = await db.collection('items').doc(itemId).get();

      if (!itemDoc.exists) {
        throw new HttpsError('not-found', `Item with ID ${itemId} not found`);
      }

      const existingItem = itemDoc.data();

      // Verify user owns this item
      if (existingItem?.userId !== request.auth?.uid) {
        throw new HttpsError('permission-denied', 'User can only update their own items');
      }

      // Don't allow changing userId
      const sanitizedData = { ...itemData };
      delete sanitizedData.userId;
      delete sanitizedData.createdAt;

      await db
        .collection('items')
        .doc(itemId)
        .update({
          ...sanitizedData,
          updatedAt: FieldValue.serverTimestamp(),
        });

      console.log(`Updated item ${itemId} with data:`, Object.keys(sanitizedData));
      return { success: true };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('Error updating item details:', error);
      throw new HttpsError('internal', 'Error updating item details');
    }
  }
);

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
      createdAt: FieldValue.serverTimestamp(),
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
export const getOrdersFromUser = onCall(
  async (request: CallableRequest<GetOrdersFromUserRequest>) => {
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
      const ordersSnapshot = await db.collection('orders').where('userId', '==', userId).get();

      const orders = ordersSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }) as DocumentData
      );

      // Sort by creation date, newest first
      return orders.sort((a, b) => {
        const aTime = getTimestampSeconds(a.createdAt);
        const bTime = getTimestampSeconds(b.createdAt);
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching orders for user:', error);
      throw new HttpsError('internal', 'Error fetching orders');
    }
  }
);

/**
 * Get orders for a shop
 */
export const getOrdersForShop = onCall(
  async (request: CallableRequest<GetOrdersForShopRequest>) => {
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
        throw new HttpsError(
          'permission-denied',
          'User can only access orders for their own shops'
        );
      }

      const ordersSnapshot = await db.collection('orders').where('shopId', '==', shopId).get();

      const orders = ordersSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...sanitizeFirestoreData(doc.data()) }) as DocumentData
      );

      // Sort by creation date, newest first
      return orders.sort((a, b) => {
        const aTime = getTimestampSeconds(a.createdAt);
        const bTime = getTimestampSeconds(b.createdAt);
        return bTime - aTime;
      });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('Error fetching orders for shop:', error);
      throw new HttpsError('internal', 'Error fetching orders');
    }
  }
);

/**
 * Update order status
 */
export const updateOrderStatus = onCall(
  async (request: CallableRequest<UpdateOrderStatusRequest>) => {
    verifyAuth(request);
    const { orderId, shopId, status } = request.data;

    if (!orderId || !shopId || !status) {
      throw new HttpsError('invalid-argument', 'Order ID, shop ID, and status are required');
    }

    try {
      // Find the order
      const ordersSnapshot = await db
        .collection('orders')
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
        throw new HttpsError(
          'permission-denied',
          'User can only update orders for their own shops or their own orders'
        );
      }

      await orderDoc.ref.update({
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log('Order status updated:', orderId, status);
      return true;
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('Error updating order status:', error);
      throw new HttpsError('internal', 'Error updating order status');
    }
  }
);

/**
 * Get comprehensive orders for a user (both placed and received)
 */
export const getOrdersForUser = onCall(
  async (request: CallableRequest<GetOrdersForUserRequest>) => {
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
      const placedOrdersSnapshot = await db
        .collection('orders')
        .where('userId', '==', userId)
        .get();

      const placedOrders = placedOrdersSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...sanitizeFirestoreData(doc.data()),
          }) as DocumentData
      );

      // Get orders received by the user's shops (as shop owner)
      const userShopsSnapshot = await db.collection('shops').where('userId', '==', userId).get();

      const shopIds = userShopsSnapshot.docs.map((doc) => doc.id);

      const receivedOrders: DocumentData[] = [];

      // Get orders for all user's shops in parallel
      await Promise.all(
        shopIds.map(async (shopId) => {
          const shopOrdersSnapshot = await db
            .collection('orders')
            .where('shopId', '==', shopId)
            .get();

          shopOrdersSnapshot.forEach((orderDoc) => {
            receivedOrders.push({
              id: orderDoc.id,
              ...sanitizeFirestoreData(orderDoc.data()),
              shopOwnerView: true,
            } as DocumentData);
          });
        })
      );

      // Combine and sort all orders by creation date
      const allOrders = [...placedOrders, ...receivedOrders].sort((a, b) => {
        const aTime = getTimestampSeconds(a.createdAt);
        const bTime = getTimestampSeconds(b.createdAt);
        return bTime - aTime;
      });

      // Sort individual arrays as well
      placedOrders.sort((a, b) => {
        const aTime = getTimestampSeconds(a.createdAt);
        const bTime = getTimestampSeconds(b.createdAt);
        return bTime - aTime;
      });

      receivedOrders.sort((a, b) => {
        const aTime = getTimestampSeconds(a.createdAt);
        const bTime = getTimestampSeconds(b.createdAt);
        return bTime - aTime;
      });

      return {
        placedOrders,
        receivedOrders,
        allOrders,
      };
    } catch (error) {
      console.error('Error fetching comprehensive orders for user:', error);
      throw new HttpsError('internal', 'Error fetching orders');
    }
  }
);

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
    const ordersSnapshot = await db
      .collection('orders')
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
      throw new HttpsError(
        'permission-denied',
        'User can only access their own orders or orders for their shops'
      );
    }

    return {
      id: orderDoc.id,
      ...sanitizeFirestoreData(orderData),
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
      return { id: userDoc.id, ...sanitizeFirestoreData(userDoc.data()) };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new HttpsError('internal', 'Error fetching user');
  }
});

// =============================================================================
// Message Thread Operations
// =============================================================================

interface CreateOrGetThreadRequest {
  participantIds: string[]; // Array of exactly 2 user IDs
  initialMessage?: {
    type: 'text' | 'order';
    content?: string;
    orderId?: string;
    orderData?: DocumentData;
  };
}

interface GetThreadsForUserRequest {
  userId: string;
}

interface GetMessagesForThreadRequest {
  threadId: string;
}

interface SendMessageRequest {
  threadId: string;
  message: {
    type: 'text' | 'order';
    content?: string;
    orderId?: string;
    orderData?: DocumentData;
  };
}

interface DeleteThreadRequest {
  threadId: string;
}

interface MarkThreadAsReadRequest {
  threadId: string;
}

/**
 * Create or get an existing thread between two users
 * Ensures only one thread exists between any two users
 */
export const createOrGetThread = onCall(
  async (request: CallableRequest<CreateOrGetThreadRequest>) => {
    verifyAuth(request);
    const { participantIds, initialMessage } = request.data;

    if (!participantIds || participantIds.length !== 2) {
      throw new HttpsError('invalid-argument', 'Exactly 2 participant IDs are required');
    }

    // Verify the authenticated user is one of the participants
    if (!participantIds.includes(request.auth!.uid)) {
      throw new HttpsError('permission-denied', 'User must be a participant in the thread');
    }

    try {
      // Sort participant IDs to ensure consistent ordering for queries
      const sortedParticipants = [...participantIds].sort();

      // Check if a thread already exists between these users
      const existingThreadsSnapshot = await db
        .collection('threads')
        .where('participantIds', '==', sortedParticipants)
        .limit(1)
        .get();

      if (!existingThreadsSnapshot.empty) {
        // Thread exists, return it
        const existingThread = existingThreadsSnapshot.docs[0];
        const threadData = existingThread.data();

        // If there's an initial message (order), add it to the existing thread
        if (initialMessage) {
          const messagesRef = db
            .collection('threads')
            .doc(existingThread.id)
            .collection('messages');
          await messagesRef.add({
            senderId: request.auth!.uid,
            type: initialMessage.type,
            content: initialMessage.content || '',
            orderId: initialMessage.orderId || null,
            orderData: initialMessage.orderData || null,
            createdAt: FieldValue.serverTimestamp(),
            read: false,
          });

          // Update thread's lastMessage and updatedAt
          await existingThread.ref.update({
            lastMessage: {
              type: initialMessage.type,
              content:
                initialMessage.type === 'order' ? 'New order placed' : initialMessage.content,
              senderId: request.auth!.uid,
              createdAt: FieldValue.serverTimestamp(),
            },
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        return {
          id: existingThread.id,
          ...sanitizeFirestoreData(threadData),
          isNew: false,
        };
      }

      // Create a new thread
      // First, fetch participant info for the thread metadata
      const participantInfo: Record<string, { username: string; photoURL: string | null }> = {};

      for (const participantId of sortedParticipants) {
        const userDoc = await db.collection('users').doc(participantId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          participantInfo[participantId] = {
            username: userData?.username || 'Unknown',
            photoURL: userData?.photoURL || null,
          };
        } else {
          participantInfo[participantId] = {
            username: 'Unknown',
            photoURL: null,
          };
        }
      }

      const newThreadData = {
        participantIds: sortedParticipants,
        participantInfo,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastMessage: initialMessage
          ? {
              type: initialMessage.type,
              content:
                initialMessage.type === 'order' ? 'New order placed' : initialMessage.content,
              senderId: request.auth!.uid,
              createdAt: FieldValue.serverTimestamp(),
            }
          : null,
      };

      const threadRef = await db.collection('threads').add(newThreadData);

      // Add initial message if provided
      if (initialMessage) {
        const messagesRef = db.collection('threads').doc(threadRef.id).collection('messages');
        await messagesRef.add({
          senderId: request.auth!.uid,
          type: initialMessage.type,
          content: initialMessage.content || '',
          orderId: initialMessage.orderId || null,
          orderData: initialMessage.orderData || null,
          createdAt: FieldValue.serverTimestamp(),
          read: false,
        });
      }

      console.log('Thread created with ID:', threadRef.id);
      return {
        id: threadRef.id,
        ...sanitizeFirestoreData(newThreadData),
        isNew: true,
      };
    } catch (error) {
      console.error('Error creating or getting thread:', error);
      throw new HttpsError('internal', 'Error creating or getting thread');
    }
  }
);

/**
 * Get all threads for a user
 */
export const getThreadsForUser = onCall(
  async (request: CallableRequest<GetThreadsForUserRequest>) => {
    verifyAuth(request);
    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    // Verify the authenticated user matches the userId
    if (request.auth?.uid !== userId) {
      throw new HttpsError('permission-denied', 'User can only access their own threads');
    }

    try {
      const threadsSnapshot = await db
        .collection('threads')
        .where('participantIds', 'array-contains', userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const threads = threadsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...sanitizeFirestoreData(doc.data()),
      }));

      return threads;
    } catch (error) {
      console.error('Error fetching threads for user:', error);
      throw new HttpsError('internal', 'Error fetching threads');
    }
  }
);

/**
 * Get messages for a thread
 */
export const getMessagesForThread = onCall(
  async (request: CallableRequest<GetMessagesForThreadRequest>) => {
    verifyAuth(request);
    const { threadId } = request.data;

    if (!threadId) {
      throw new HttpsError('invalid-argument', 'Thread ID is required');
    }

    try {
      // Verify user is a participant of this thread
      const threadDoc = await db.collection('threads').doc(threadId).get();
      if (!threadDoc.exists) {
        throw new HttpsError('not-found', 'Thread not found');
      }

      const threadData = threadDoc.data();
      if (!threadData?.participantIds?.includes(request.auth!.uid)) {
        throw new HttpsError('permission-denied', 'User is not a participant of this thread');
      }

      const messagesSnapshot = await db
        .collection('threads')
        .doc(threadId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get();

      const messages = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...sanitizeFirestoreData(doc.data()),
      }));

      return messages;
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('Error fetching messages for thread:', error);
      throw new HttpsError('internal', 'Error fetching messages');
    }
  }
);

/**
 * Send a message to a thread
 */
export const sendMessage = onCall(async (request: CallableRequest<SendMessageRequest>) => {
  verifyAuth(request);
  const { threadId, message } = request.data;

  if (!threadId || !message) {
    throw new HttpsError('invalid-argument', 'Thread ID and message are required');
  }

  try {
    // Verify user is a participant of this thread
    const threadDoc = await db.collection('threads').doc(threadId).get();
    if (!threadDoc.exists) {
      throw new HttpsError('not-found', 'Thread not found');
    }

    const threadData = threadDoc.data();
    if (!threadData?.participantIds?.includes(request.auth!.uid)) {
      throw new HttpsError('permission-denied', 'User is not a participant of this thread');
    }

    // Add the message
    const messagesRef = db.collection('threads').doc(threadId).collection('messages');
    const messageDoc = await messagesRef.add({
      senderId: request.auth!.uid,
      type: message.type,
      content: message.content || '',
      orderId: message.orderId || null,
      orderData: message.orderData || null,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    });

    // Update thread's lastMessage and updatedAt
    await threadDoc.ref.update({
      lastMessage: {
        type: message.type,
        content: message.type === 'order' ? 'New order placed' : message.content,
        senderId: request.auth!.uid,
        createdAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('Message sent with ID:', messageDoc.id);
    return {
      id: messageDoc.id,
      senderId: request.auth!.uid,
      type: message.type,
      content: message.content || '',
      orderId: message.orderId || null,
      orderData: message.orderData || null,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error sending message:', error);
    throw new HttpsError('internal', 'Error sending message');
  }
});

/**
 * Delete a thread (soft delete - marks as deleted for the user)
 */
export const deleteThread = onCall(async (request: CallableRequest<DeleteThreadRequest>) => {
  verifyAuth(request);
  const { threadId } = request.data;

  if (!threadId) {
    throw new HttpsError('invalid-argument', 'Thread ID is required');
  }

  try {
    // Verify user is a participant of this thread
    const threadDoc = await db.collection('threads').doc(threadId).get();
    if (!threadDoc.exists) {
      throw new HttpsError('not-found', 'Thread not found');
    }

    const threadData = threadDoc.data();
    if (!threadData?.participantIds?.includes(request.auth!.uid)) {
      throw new HttpsError('permission-denied', 'User is not a participant of this thread');
    }

    // Soft delete: add user to deletedBy array
    // The thread will be hidden from this user but still visible to the other participant
    await threadDoc.ref.update({
      deletedBy: FieldValue.arrayUnion(request.auth!.uid),
    });

    console.log('Thread deleted for user:', request.auth!.uid);
    return true;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error deleting thread:', error);
    throw new HttpsError('internal', 'Error deleting thread');
  }
});

/**
 * Mark a thread as read
 */
export const markThreadAsRead = onCall(
  async (request: CallableRequest<MarkThreadAsReadRequest>) => {
    verifyAuth(request);
    const { threadId } = request.data;

    if (!threadId) {
      throw new HttpsError('invalid-argument', 'Thread ID is required');
    }

    try {
      // Verify user is a participant of this thread
      const threadDoc = await db.collection('threads').doc(threadId).get();
      if (!threadDoc.exists) {
        throw new HttpsError('not-found', 'Thread not found');
      }

      const threadData = threadDoc.data();
      if (!threadData?.participantIds?.includes(request.auth!.uid)) {
        throw new HttpsError('permission-denied', 'User is not a participant of this thread');
      }

      const batch = db.batch();

      // Mark all messages not sent by this user as read
      const unreadMessages = await db
        .collection('threads')
        .doc(threadId)
        .collection('messages')
        .where('senderId', '!=', request.auth!.uid)
        .where('read', '==', false)
        .get();

      unreadMessages.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      // Store lastReadAt timestamp for this user in the thread document
      const lastReadBy = threadData.lastReadBy || {};
      lastReadBy[request.auth!.uid] = FieldValue.serverTimestamp();

      batch.update(threadDoc.ref, {
        lastReadBy: lastReadBy,
      });

      await batch.commit();

      console.log(`Marked ${unreadMessages.size} messages as read for user:`, request.auth!.uid);
      return true;
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('Error marking thread as read:', error);
      throw new HttpsError('internal', 'Error marking thread as read');
    }
  }
);

// =============================================================================
// Push Notification Operations
// =============================================================================

interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Register a push notification token for a user
 */
export const registerPushToken = onCall(
  async (request: CallableRequest<RegisterPushTokenRequest>) => {
    verifyAuth(request);
    const { token, platform } = request.data;

    if (!token || !platform) {
      throw new HttpsError('invalid-argument', 'Token and platform are required');
    }

    try {
      const userId = request.auth!.uid;

      await db
        .collection('users')
        .doc(userId)
        .update({
          [`pushTokens.${platform}`]: token,
          [`pushTokens.updatedAt`]: FieldValue.serverTimestamp(),
        });

      console.log(`Push token registered for user ${userId} on ${platform}`);
      return true;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw new HttpsError('internal', 'Error registering push token');
    }
  }
);

/**
 * Send a push notification to a specific user
 * This is called internally by other functions, not directly by clients
 */
async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    // Get user's push tokens
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('User not found for push notification:', userId);
      return false;
    }

    const userData = userDoc.data();
    const pushTokens = userData?.pushTokens;

    if (!pushTokens) {
      console.log('No push tokens found for user:', userId);
      return false;
    }

    // Collect all valid tokens
    const tokens: string[] = [];
    if (pushTokens.ios) tokens.push(pushTokens.ios);
    if (pushTokens.android) tokens.push(pushTokens.android);
    if (pushTokens.web) tokens.push(pushTokens.web);

    if (tokens.length === 0) {
      console.log('No valid push tokens for user:', userId);
      return false;
    }

    // Send notification via Expo's push service
    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data: data || {},
    }));

    // Use fetch to send to Expo's push notification service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send notification when a new message is received
 * Called after sendMessage succeeds
 */
export const sendMessageNotification = onCall(
  async (
    request: CallableRequest<{
      threadId: string;
      recipientId: string;
      senderName: string;
      messagePreview: string;
      messageType: 'text' | 'order';
    }>
  ) => {
    verifyAuth(request);
    const { threadId, recipientId, senderName, messagePreview, messageType } = request.data;

    if (!threadId || !recipientId || !senderName) {
      throw new HttpsError(
        'invalid-argument',
        'Thread ID, recipient ID, and sender name are required'
      );
    }

    try {
      const title = messageType === 'order' ? `New order from ${senderName}` : senderName;
      const body =
        messageType === 'order' ? 'You have a new order! Tap to view details.' : messagePreview;

      await sendPushNotificationToUser(recipientId, title, body, {
        type: 'message',
        threadId,
        senderId: request.auth!.uid,
        senderName,
        messagePreview,
      });

      return true;
    } catch (error) {
      console.error('Error sending message notification:', error);
      // Don't throw - notification failure shouldn't break the message flow
      return false;
    }
  }
);

/**
 * Send notification when order status changes
 */
export const sendOrderStatusNotification = onCall(
  async (
    request: CallableRequest<{
      orderId: string;
      recipientId: string;
      shopName: string;
      newStatus: string;
    }>
  ) => {
    verifyAuth(request);
    const { orderId, recipientId, shopName, newStatus } = request.data;

    if (!orderId || !recipientId || !shopName || !newStatus) {
      throw new HttpsError(
        'invalid-argument',
        'Order ID, recipient ID, shop name, and status are required'
      );
    }

    try {
      const statusMessages: Record<string, string> = {
        preparing: `${shopName} is preparing your order!`,
        ready: `Your order from ${shopName} is ready for pickup!`,
        'in-delivery': `Your order from ${shopName} is on its way!`,
        completed: `Your order from ${shopName} has been delivered!`,
        cancelled: `Your order from ${shopName} has been cancelled.`,
      };

      const body = statusMessages[newStatus] || `Order status updated to: ${newStatus}`;

      await sendPushNotificationToUser(recipientId, 'Order Update', body, {
        type: 'order_update',
        orderId,
        status: newStatus,
      });

      return true;
    } catch (error) {
      console.error('Error sending order status notification:', error);
      return false;
    }
  }
);
