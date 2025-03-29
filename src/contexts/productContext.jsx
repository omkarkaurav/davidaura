// src/contexts/ProductContext.js
import React, { createContext, useState, useEffect } from "react";
import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import { db } from "../../configs";
import { productsTable } from "../../configs/schema";

const initialProducts = [
  {
    id: 1,
    name: "Attractive",
    oprice: 1999,
    size: 100,
    discount: 65,
    img: ProductImage,
    description:
      "An alluring scent that captivates attention with its bold, sophisticated blend.",
    composition: "Top notes: Bergamot; Heart notes: Jasmine; Base notes: Amber",
    fragranceNotes: "Citrus, Floral, Warm Amber",
    fragrance: "Eau de Parfum",
  },
  {
    id: 2,
    name: "Desire",
    oprice: 1999,
    size: 100,
    discount: 65,
    img: ProductImage,
    description:
      "A seductive fragrance that exudes passion and allure, perfect for an evening out.",
    composition:
      "Top notes: Black Pepper; Heart notes: Rose; Base notes: Patchouli",
    fragranceNotes: "Spicy, Floral, Earthy",
    fragrance: "Eau de Toilette",
  },
  {
    id: 3,
    name: "Heaven",
    oprice: 1999,
    size: 100,
    discount: 65,
    img: ProductImage,
    description:
      "A divine aroma that transports you to an ethereal realm of tranquility and bliss.",
    composition: "Top notes: Lavender; Heart notes: Vanilla; Base notes: Musk",
    fragranceNotes: "Soothing, Warm, Sweet",
    fragrance: "Eau de Parfum",
  },
  {
    id: 4,
    name: "Wild",
    oprice: 1999,
    size: 100,
    discount: 65,
    img: ProductImage,
    description:
      "An untamed scent that celebrates freedom and the raw beauty of nature.",
    composition:
      "Top notes: Citrus; Heart notes: Cedarwood; Base notes: Oakmoss",
    fragranceNotes: "Woody, Fresh, Zesty",
    fragrance: "Eau de Cologne",
  },
];

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(initialProducts);
  const getproducts = async () => {
    try {
      const res = await db.select().from(productsTable);
      setProducts(res);
    } catch (error) {}
  };
  useEffect(() => {
    getproducts();
    // Optionally load products from localStorage if available.
    // const storedProducts = getproducts();
    // console.log(storedProducts);
    // if (storedProducts) {
    // }
  }, []);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  return (
    <ProductContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
