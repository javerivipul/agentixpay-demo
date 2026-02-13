/**
 * GraphQL queries and mutations for the Vendure Shop API.
 * Ported from Demo_2/agentix-vendure and adapted for the production adapter.
 */

export const SEARCH_PRODUCTS = `
  query SearchProducts($term: String!, $take: Int) {
    search(input: { term: $term, take: $take }) {
      totalItems
      items {
        productId
        productName
        slug
        description
        currencyCode
        priceWithTax {
          ... on SinglePrice {
            value
          }
          ... on PriceRange {
            min
            max
          }
        }
        productAsset {
          id
          preview
        }
        productVariantId
        productVariantName
        sku
      }
    }
  }
`;

export const GET_PRODUCT = `
  query GetProduct($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      variants {
        id
        name
        sku
        priceWithTax
        currencyCode
        stockLevel
      }
      featuredAsset {
        preview
      }
      assets {
        preview
      }
    }
  }
`;

export const GET_PRODUCT_BY_ID = `
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      name
      slug
      description
      variants {
        id
        name
        sku
        priceWithTax
        currencyCode
        stockLevel
      }
      featuredAsset {
        preview
      }
      assets {
        preview
      }
    }
  }
`;

export const ADD_ITEM_TO_ORDER = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      __typename
      ... on Order {
        id
        code
        state
        totalWithTax
        subTotalWithTax
        currencyCode
        lines {
          id
          quantity
          linePriceWithTax
          productVariant {
            id
            name
            sku
            priceWithTax
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on InsufficientStockError {
        errorCode
        message
        quantityAvailable
      }
    }
  }
`;

export const GET_ACTIVE_ORDER = `
  query GetActiveOrder {
    activeOrder {
      id
      code
      state
      currencyCode
      totalWithTax
      subTotalWithTax
      shippingWithTax
      totalQuantity
      lines {
        id
        quantity
        linePriceWithTax
        productVariant {
          id
          name
          sku
          priceWithTax
          featuredAsset {
            preview
          }
        }
      }
      shippingAddress {
        fullName
        streetLine1
        streetLine2
        city
        province
        postalCode
        countryCode
      }
      shippingLines {
        shippingMethod {
          id
          name
        }
        priceWithTax
      }
      customer {
        id
        emailAddress
        firstName
        lastName
      }
    }
  }
`;

export const SET_CUSTOMER = `
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      __typename
      ... on Order {
        id
        customer {
          id
          emailAddress
          firstName
          lastName
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const SET_SHIPPING_ADDRESS = `
  mutation SetShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      __typename
      ... on Order {
        id
        shippingAddress {
          fullName
          streetLine1
          streetLine2
          city
          province
          postalCode
          countryCode
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GET_SHIPPING_METHODS = `
  query GetShippingMethods {
    eligibleShippingMethods {
      id
      name
      description
      price
      priceWithTax
      metadata
    }
  }
`;

export const SET_SHIPPING_METHOD = `
  mutation SetShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      __typename
      ... on Order {
        id
        shippingWithTax
        shippingLines {
          shippingMethod {
            id
            name
          }
          priceWithTax
        }
        totalWithTax
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const TRANSITION_TO_ARRANGING_PAYMENT = `
  mutation TransitionToArrangingPayment {
    transitionOrderToState(state: "ArrangingPayment") {
      __typename
      ... on Order {
        id
        state
        totalWithTax
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        fromState
        toState
        transitionError
      }
    }
  }
`;

export const ADD_PAYMENT = `
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      __typename
      ... on Order {
        id
        code
        state
        totalWithTax
        payments {
          id
          method
          amount
          state
          transactionId
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on PaymentFailedError {
        errorCode
        message
        paymentErrorMessage
      }
      ... on PaymentDeclinedError {
        errorCode
        message
        paymentErrorMessage
      }
    }
  }
`;
