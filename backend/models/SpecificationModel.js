import mongoose from "mongoose";

const specificationSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
    },
    group: {
      type: String,
    },
  },
  { timestamps: true }
);

const Specification = mongoose.model("Specification", specificationSchema);
export default Specification;