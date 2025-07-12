const Product = require('../models/Product');

// A map of available commands the agent can use.
const commands = {
  search_products: {
    description: "Searches for products in the database based on a query. Use regex for partial, case-insensitive text matches.",
    args: {
      query: "<object> A valid MongoDB find() query object. Example: { 'name': { '$regex': 'shoe', '$options': 'i' } }",
      sort: "<object> A valid MongoDB sort() object. Example: { 'price': 1 } for ascending.",
      limit: "<number> The maximum number of products to return. Defaults to 5."
    },
    execute: async ({ query, sort, limit }) => {
      try {
        const products = await Product.find(query || {})
          .sort(sort || {})
          .limit(limit || 5);
        if (products.length === 0) {
          return { success: true, result: "No products found matching the criteria.", data: [] };
        }
        return { success: true, result: `Found ${products.length} products.`, data: products };
      } catch (e) {
        console.error("Error during product search:", e);
        return { success: false, result: `Error executing search: The query might be malformed.`, data: null };
      }
    }
  },
  add_to_cart: {
    description: "Adds a product to the user's shopping cart. Note: This is a simulation and cannot modify the actual cart.",
    args: {
      product_name: "<string> The name of the product to add.",
      quantity: "<number> The number of items to add."
    },
    execute: async ({ product_name, quantity }) => {
      return {
        success: false,
        result: "As an AI assistant, I can't add items to your cart directly. However, I can help you find the product page for '" + product_name + "'.",
        data: null
      };
    }
  },
  task_complete: {
    description: "Use this command when the user's request has been fully addressed and no further action is needed from the system.",
    args: {
      reason: "<string> A brief summary of why the task is considered complete."
    },
    execute: async ({ reason }) => {
      return { success: true, result: `Task completed: ${reason}`, data: null };
    }
  }
};

module.exports = commands;