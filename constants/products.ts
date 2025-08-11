export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: 'gas' | 'diesel' | 'petrol';
  size?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'gas-9kg',
    name: '9kg LPG Gas (Refill)',
    description: "Small knee height bottle used for braai's, stoves & heaters. REFILL ONLY!",
    price: 344.0,
    image: 'gas-cylinder-9kg',
    type: 'gas',
    size: '9kg',
  },
  {
    id: 'gas-19kg',
    name: '19kg LPG Gas (Refill)',
    description:
      "Mid sized bottle used for braai's, stoves, heaters and small gas water heaters. REFILL ONLY!",
    price: 727.0,
    image: 'gas-cylinder-19kg',
    type: 'gas',
    size: '19kg',
  },
  {
    id: 'gas-48kg',
    name: '48kg LPG Gas (Refill)',
    description:
      'Large commercial sized bottle used for restaurants, large heaters and gas water heaters. REFILL ONLY!',
    price: 1850.0,
    image: 'gas-cylinder-48kg',
    type: 'gas',
    size: '48kg',
  },
  {
    id: 'diesel-20l',
    name: 'Diesel 20L Container',
    description: 'High-quality diesel fuel for generators and diesel engines. 20L container.',
    price: 420.0,
    image: 'fuel-container',
    type: 'diesel',
  },
  {
    id: 'petrol-20l',
    name: 'Petrol 20L Container',
    description: 'Premium unleaded petrol for generators and petrol engines. 20L container.',
    price: 450.0,
    image: 'fuel-container',
    type: 'petrol',
  },
];
