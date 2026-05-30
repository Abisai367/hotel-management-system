import { useState, useEffect } from "react"
import './UploadCategories.css'
import { Link } from "react-router-dom";
import ScrollReveal from "scrollreveal";
export default function UploadCategories(){
    const [product_name, setProductName] = useState("");
    const [description, setDescription] = useState("");   
    const [preview, setPreview] = useState(null);
    const [price, setPrice] =useState("")
    const [file, setFile] = useState(null)
    const [productList, setProductList] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [showDeletePane, setShowDeletePane] = useState(false);
    const [formMessage, setFormMessage] = useState("");
    const baseUrl = import.meta.env.BASE_URL || '/';
    const defaultApiPath = import.meta.env.MODE === 'development' ? '/api' : `${baseUrl}api`;
    const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || defaultApiPath.replace(/\/+/g, '/');
    const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'hotel_cloud';
    const [deleteByName, setDeleteByName] = useState("");

    const fetchProducts = async () => {
        try {
            setIsLoadingProducts(true);
            const response = await fetch(`${apiUrl}/index.php`);
            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.statusText}`);
            }
            const data = await response.json();
            setProductList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProductList([]);
            setFormMessage('Failed to load products. Please refresh the page.');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleImageChange = (e) => {
        const selectedFile = e.target.files[0]
        if(selectedFile){
            setFile(selectedFile);
            const imageUrl = URL.createObjectURL(selectedFile);
            setPreview(imageUrl);
        }
    };
    const productName = (e) =>{
        setProductName(e.target.value.toLowerCase());
    }

    const productDescription = (e) =>{
        setDescription(e.target.value)
    }
    
    const productPrice = (e) =>{
        setPrice(e.target.value)
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!product_name || !description || !price || !file) {
            setFormMessage("Please fill all fields and upload an image.");
            return;
        }

        setFormMessage("Uploading image to cloud storage...");
        
        let uploadedImageUrl = "";

        try {
            const cloudinaryData = new FormData();
            cloudinaryData.append("file", file);
            cloudinaryData.append("upload_preset", "hotel_preset"); 

            const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;

            const cloudinaryResponse = await fetch(cloudinaryEndpoint, { 
                method: "POST", 
                body: cloudinaryData 
            });

            if (!cloudinaryResponse.ok) {
                const errorText = await cloudinaryResponse.text();
                throw new Error(errorText || "Cloudinary upload rejected.");
            }

            const cloudJson = await cloudinaryResponse.json();
            uploadedImageUrl = cloudJson.secure_url; 
        } catch (cloudErr) {
            console.error(cloudErr);
            setFormMessage(`Image cloud storage failed: ${cloudErr.message}`);
            return;
        }

        setFormMessage("Saving product details to database...");

        const formdata = new FormData();
        formdata.append('description', description);
        formdata.append('product_name', product_name);
        formdata.append('price', price);
        formdata.append('file_url', uploadedImageUrl); 

        try {
            const response = await fetch(`${apiUrl}/addcategory.php`, {
                method: 'POST',
                body: formdata
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText} ${text}`);
            }
            const data = await response.json();
            if(data.status === 'success'){
                setFormMessage("Product added successfully.");
                setProductName("");
                setDescription("");
                setPrice("");
                setFile(null);
                setPreview(null);
                await fetchProducts();
            } else {
                setFormMessage(data.message || 'Unable to save product.');
            }
        }
        catch(error){
            console.error(error);
            setFormMessage("Unable to communicate with the server. Please try again later.");
        }
    }

    const handleDelete = async (product) => {
        const confirmed = window.confirm(`Delete ${product.product_name}? This action cannot be undone.`);
        if (!confirmed) return;

        setDeleteLoading(product.id);
        try {
            const response = await fetch(`${apiUrl}/delete.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: product.id, product_path: product.product_path })
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText} ${text}`);
            }
            const result = await response.json();
            if (result.status === 'success') {
                await fetchProducts();
                setFormMessage(`${product.product_name} was deleted successfully.`);
            } else {
                setFormMessage(result.message || 'Unable to delete product.');
            }
        } catch (error) {
            console.error(error);
            setFormMessage('Delete request failed. Please try again later.');
        } finally {
            setDeleteLoading(null);
        }
    }

    const handleDeleteByName = async (name) => {
        const trimmedName = name?.trim().toLowerCase();
        if (!trimmedName) {
            setFormMessage('Please type a product name to delete.');
            return;
        }

        setFormMessage('');
        setDeleteLoading('by-name');
        try {
            const response = await fetch(`${apiUrl}/delete.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_name: trimmedName })
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText} ${text}`);
            }
            const result = await response.json();
            if (result.status === 'success') {
                setFormMessage(`${trimmedName} deleted successfully.`);
                setDeleteByName("");
                await fetchProducts();
            } else {
                setFormMessage(result.message || 'Unable to delete product by name.');
            }
        } catch (error) {
            console.error(error);
            setFormMessage('Delete request failed. Please try again later.');
        } finally {
            setDeleteLoading(null);
        }
    }

    useEffect(() => {
      fetchProducts();
      const sr = ScrollReveal({ reset: false });
      sr.reveal('.upload-title', {
        distance: '30px',
        origin: 'top',
        duration: 700,
        easing: 'ease-in-out',
      });
      sr.reveal('.upload-form > label, .upload-form > input, .upload-form > textarea, .upload-form > .image-display, .upload-form > button', {
        distance: '20px',
        origin: 'bottom',
        duration: 600,
        interval: 80,
        easing: 'ease-in-out',
      });
      return () => sr.destroy();
    }, []);

    return(
        <div className="upload-container">
            <div className="upload-content">
                <h1 className="upload-title">ADD NEW PRODUCT</h1>
                <form className="upload-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor='product-name'>Enter Product Name <span className="required">*</span></label>
                        <input type="text" maxLength={30} id="product-name" value={product_name} name="product_name" placeholder="example Burger" onChange={productName}/>
                    </div>

                    <div className="form-group">
                        <label htmlFor='description'>Enter Product Description <span className="required">*</span></label>
                        <textarea type="text" maxLength={100} id="description" value={description} name="description" placeholder="example 170g vanilla test" onChange={productDescription}/>
                    </div>

                    <div className="form-group">
                        <label htmlFor='price'>Price (Kshs.) <span className="required">*</span></label>
                        <input type="number" maxLength={10} min={5} id="price" value={price} name="price" placeholder="500" onChange={productPrice}/>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor='image'>Upload photo <span className="required">*</span></label>
                        <input type="file" id="image" accept="image/*" onChange={handleImageChange}/>
                        {preview && (
                            <div className="image-display">
                                <img src={preview} alt="Your Image"/>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">ADD PRODUCT</button>
                        <Link to="/categories" className="btn btn-secondary">View Categories</Link>
                    </div>
                    {formMessage && <p className="form-message">{formMessage}</p>}
                </form>
                <div className="product-management">
                    <div className="product-management-header">
                        <h2>Admin Product Management</h2>
                        <p>Delete products directly from the add product page.</p>
                        <div className="delete-by-name">
                            <label htmlFor="delete-by-name-input">Delete by product name</label>
                            <input
                                id="delete-by-name-input"
                                type="text"
                                placeholder="Type product name to delete"
                                value={deleteByName}
                                onChange={(e) => setDeleteByName(e.target.value.toLowerCase())}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDeleteByName(deleteByName); } }}
                            />
                            {deleteByName.trim().length > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-delete-name"
                                    onClick={() => handleDeleteByName(deleteByName)}
                                    disabled={deleteLoading === 'by-name'}
                                >
                                    {deleteLoading === 'by-name' ? 'Deleting...' : 'Delete product'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="delete-admin-toolbar">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowDeletePane((prev) => !prev)}
                        >
                            {showDeletePane ? 'Hide delete selection' : 'Select item to delete'}
                        </button>
                    </div>
                    {showDeletePane ? (
                        isLoadingProducts ? (
                            <p className="loading-text">Loading products...</p>
                        ) : (
                            <div className="product-grid-admin">
                                {productList.length === 0 ? (
                                    <p className="empty-text">No products available yet.</p>
                                ) : (
                                    productList.map((product) => (
                                        <div className="product-card" key={product.id || product.product_name}>
                                            <div className="product-card-image">
                                                <img
                                                    src={product.product_path || ''}
                                                    alt={product.product_name}
                                                />
                                            </div>
                                            <div className="product-card-body">
                                                <div>
                                                    <h3>{product.product_name}</h3>
                                                    <p>{product.description}</p>
                                                </div>
                                                <div className="product-card-meta">
                                                    <span className="card-price">Kshs. {product.price}</span>
                                                    <button
                                                        className="btn btn-delete"
                                                        onClick={() => handleDelete(product)}
                                                        disabled={deleteLoading === product.id}
                                                    >
                                                        {deleteLoading === product.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )
                    ) : (
                        <p className="admin-help-text">Click the button above to select an item to delete from the list.</p>
                    )}
                </div>
            </div>
        </div>
    )
}