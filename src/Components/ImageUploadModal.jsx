import React, { useState } from "react";
import useCloudinary from "../utils/useCloudinary"; // Import custom hook
import { db } from "../../configs";
import { productsTable } from "../../configs/schema";

const ImageUploadModal = ({ isopen }) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const { uploadImage, uploading, uploadedUrl, error } = useCloudinary();

  const [product, setProduct] = useState({
    name: "",
    composition: "",
    description: "",
    fragrance: "",
    fragranceNotes: "",
    discount: "",
    oprice: "",
    size: "",
    imageurl: "",
  });

  // Handle input change
  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setImage(file);
  };

  // Handle image upload & move to next step
  const handleUpload = async () => {
    try {
      const res = await uploadImage(image);

      setProduct((prev) => ({ ...prev, imageurl: uploadedUrl }));
      setStep(2);
    } catch (error) {
      console.log(error);
    }
  };

  const handlesubmit = async () => {
    try {
      const res = await db
        .insert(productsTable)
        .values({ ...product, imageurl: uploadedUrl })
        .returning(productsTable);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
    setIsOpen(false);
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center">
          <div className="bg-black text-white p-6 rounded-lg shadow-xl w-96 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-3 text-white hover:text-white"
            >
              ✖
            </button>

            {/* Step 1: Upload Image */}
            {step === 1 ? (
              <div className="text-center  flex items-center justify-center flex-col">
                <h2 className="text-lg font-semibold">Upload Product Image</h2>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="  w-full cursor-pointer "
                />
                <button
                  onClick={handleUpload}
                  disabled={uploading || !image}
                  className="mt-4 bg-blue-500 px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </div>
            ) : (
              // Step 2: Product Details
              <div>
                <h2 className="text-lg font-semibold">Enter Product Details</h2>
                <div className="grid gap-3 mt-4 ">
                  <input
                    name="name"
                    placeholder="Product Name"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    name="composition"
                    placeholder="Composition"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    name="description"
                    placeholder="Description"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    name="fragrance"
                    placeholder="Fragrance"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    name="fragranceNotes"
                    placeholder="Fragrance Notes"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />

                  <input
                    type="number"
                    name="discount"
                    placeholder="Discount %"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    type="number"
                    name="oprice"
                    placeholder="Original Price"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    type="number"
                    name="size"
                    placeholder="Size"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                </div>
                <div className="  flex justify-center items-center ">
                  <button
                    className="mt-4 bg-black px-4 py-2 rounded transition"
                    onClick={handlesubmit}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadModal;
