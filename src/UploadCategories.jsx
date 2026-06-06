import { useState, useEffect } from "react"
import './UploadCategories.css'
import { Link } from "react-router-dom";
import ScrollReveal from "scrollreveal";
import { getApiUrl } from './apiUrl.js';
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
    const [showAddPane, setShowAddPane] = useState(true);
    const [showCustomizePane, setShowCustomizePane] = useState(false);
    const [formMessage, setFormMessage] = useState("");
    const apiUrl = getApiUrl();
    const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'hotel_cloud';
    const [deleteByName, setDeleteByName] = useState("");
    const [editingProduct, setEditingProduct] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editPath, setEditPath] = useState('');
    const [editFile, setEditFile] = useState(null);
    const [editPreview, setEditPreview] = useState(null);
    const [imageDeleted, setImageDeleted] = useState(false);
    const [originalEditPath, setOriginalEditPath] = useState('');

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

    const handleEditImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setEditFile(selectedFile);
            setImageDeleted(false);
            const imageUrl = URL.createObjectURL(selectedFile);
            setEditPreview(imageUrl);
        }
    };

    const deleteCurrentEditImage = () => {
        setImageDeleted(true);
        setEditFile(null);
        setEditPreview(null);
        setEditPath('');
    };

    const restoreCurrentImage = () => {
        setImageDeleted(false);
        setEditFile(null);
        setEditPath(originalEditPath);
        setEditPreview(originalEditPath);
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
            setFormMessage('Unable to upload the image. Please try again.');
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
            setFormMessage("Unable to communicate with the server. Please try again later.");
        }
    }

    const handleDelete = async (product) => {
        const confirmed = window.confirm(`Delete ${product.product_name}? This action cannot be undone.`);
        if (!confirmed) return;

        setDeleteLoading(product.product_id);
        try {
            const response = await fetch(`${apiUrl}/delete.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: product.product_id, product_path: product.product_path })
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
            setFormMessage('Delete request failed. Please try again later.');
        } finally {
            setDeleteLoading(null);
        }
    }

    const saveProductEdit = async () => {
        if (!editingProduct?.product_id) {
            setFormMessage('Select a product to edit.');
            return;
        }

        setFormMessage('Saving product updates...');

        let updatedImagePath = editPath;

        if (editFile) {
            setFormMessage('Uploading updated image...');
            try {
                const cloudinaryData = new FormData();
                cloudinaryData.append('file', editFile);
                cloudinaryData.append('upload_preset', 'hotel_preset');

                const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;
                const cloudinaryResponse = await fetch(cloudinaryEndpoint, {
                    method: 'POST',
                    body: cloudinaryData,
                });
                if (!cloudinaryResponse.ok) {
                    const errorText = await cloudinaryResponse.text();
                    throw new Error(errorText || 'Cloudinary upload rejected.');
                }
                const cloudJson = await cloudinaryResponse.json();
                updatedImagePath = cloudJson.secure_url;
            } catch (uploadError) {
                setFormMessage('Unable to upload the replacement image. Please try again.');
                return;
            }
        } else if (imageDeleted) {
            const keepOriginal = window.confirm('You deleted the current product image. Do you want to continue using the original image? Click OK to keep it, or Cancel to upload a replacement.');
            if (keepOriginal) {
                updatedImagePath = originalEditPath;
            } else {
                setFormMessage('Please upload an image to proceed.');
                return;
            }
        }

        try {
            const body = {
                id: editingProduct.product_id,
                product_name: editName,
                description: editDesc,
                price: editPrice,
                product_path: updatedImagePath,
            };
            const res = await fetch(`${apiUrl}/update_product.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const j = await res.json();
            if (j.status === 'success') {
                setFormMessage('Product updated successfully');
                setEditingProduct(null);
                setEditFile(null);
                setEditPreview(null);
                await fetchProducts();
            } else {
                setFormMessage(j.message || 'Update failed');
            }
        } catch (err) {
            setFormMessage('Unable to update the product. Please try again later.');
        }
    };

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
                <h1 className="upload-title">MANAGE PRODUCTS</h1>
                <p className="upload-subtitle">Add, edit, or remove product items cleanly from one place.</p>
                <div className="manage-actions">
                    <button className={`btn btn-primary ${showAddPane? 'active' : ''}`} onClick={() => { setShowAddPane(true); setShowDeletePane(false); setShowCustomizePane(false); }}>Add Product</button>
                    <button className={`btn btn-secondary ${showDeletePane? 'active' : ''}`} onClick={() => { setShowAddPane(false); setShowDeletePane(true); setShowCustomizePane(false); }}>Remove Product</button>
                    <button className={`btn btn-secondary ${showCustomizePane? 'active' : ''}`} onClick={() => { setShowAddPane(false); setShowDeletePane(false); setShowCustomizePane(true); }}>Edit Product</button>
                </div>
                {showAddPane && (
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
                        <button type="submit" className="btn btn-primary">{product_name ? 'Save Product' : 'Add Product'}</button>
                        <Link to="/categories" className="btn btn-secondary">View Categories</Link>
                    </div>
                    </form>
                )}
                {showDeletePane && (
                    <div className="delete-admin-toolbar">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowDeletePane((prev) => !prev)}
                        >
                            {showDeletePane ? 'Hide delete selection' : 'Select item to delete'}
                        </button>
                    </div>
                )}
                {showCustomizePane && (
                    <div className="customize-pane">
                        <p>Choose a product below and click <strong>Edit</strong> to open the inline edit panel.</p>
                        {isLoadingProducts ? (
                            <p className="loading-text">Loading products...</p>
                        ) : (
                            <div className="product-grid-admin">
                                {productList.map((p) => (
                                    <div className={`product-card ${editingProduct?.product_id === p.product_id ? 'expanded' : ''}`} key={p.product_id}>
                                        <div className="product-card-image">
                                            {p.product_path ? <img src={p.product_path} alt={p.product_name} /> : <div className="product-image-placeholder" />}
                                        </div>
                                        <div className="product-card-body">
                                            <div>
                                                <h3>{p.product_name}</h3>
                                                <p>{p.description}</p>
                                            </div>
                                            <div className="product-card-meta">
                                                <span className="card-price">Kshs. {p.price}</span>
                                                <button className="btn btn-primary" onClick={() => {
                                                    if (editingProduct?.product_id === p.product_id) {
                                                        setEditingProduct(null);
                                                        setEditFile(null);
                                                        setEditPreview(null);
                                                        return;
                                                    }
                                                    setEditingProduct(p);
                                                    setEditName(p.product_name || '');
                                                    setEditDesc(p.description || '');
                                                    setEditPrice(p.price || '');
                                                    setEditPath(p.product_path || '');
                                                    setEditFile(null);
                                                    setEditPreview(p.product_path || null);
                                                }}>
                                                    {editingProduct?.product_id === p.product_id ? 'Close' : 'Edit'}
                                                </button>
                                            </div>
                                            {editingProduct?.product_id === p.product_id && (
                                                <div className="product-edit-panel">
                                                    <div className="form-group">
                                                        <label>Name</label>
                                                        <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Description</label>
                                                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Price</label>
                                                        <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Replace product image</label>
                                                        <input type="file" accept="image/*" onChange={handleEditImageChange} />
                                                        {editPreview && (
                                                            <div className="image-display">
                                                                <img src={editPreview} alt="Product preview" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="current-image-section">
                                                        <h4>Current image</h4>
                                                        {imageDeleted ? (
                                                            <div className="deleted-image-notice">
                                                                <p>Current image removed. Upload a replacement image or restore the existing one.</p>
                                                                <button type="button" className="btn btn-secondary btn-small" onClick={restoreCurrentImage}>Restore image</button>
                                                            </div>
                                                        ) : originalEditPath ? (
                                                            <div className="current-image-preview">
                                                                <img src={originalEditPath} alt="Current product" />
                                                                <button type="button" className="btn btn-danger btn-small" onClick={deleteCurrentEditImage}>Delete image</button>
                                                            </div>
                                                        ) : (
                                                            <p className="empty-text">No current image available.</p>
                                                        )}
                                                    </div>
                                                    <div className="form-actions">
                                                        <button className="btn btn-primary" onClick={saveProductEdit}>Save</button>
                                                        <button className="btn btn-secondary" onClick={() => {
                                                            setEditingProduct(null);
                                                            setEditFile(null);
                                                            setEditPreview(null);
                                                            setImageDeleted(false);
                                                            setOriginalEditPath('');
                                                        }}>Cancel</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {formMessage && <p className="form-message">{formMessage}</p>}
                {showDeletePane && (
                    <div className="product-management">
                        <div className="product-management-header">
                            <h2>Manage existing products</h2>
                            <p>Use this section to remove product listings or edit details after they are created.</p>
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
                        {isLoadingProducts ? (
                            <p className="loading-text">Loading products...</p>
                        ) : (
                            <div className="product-grid-admin">
                                {productList.length === 0 ? (
                                    <p className="empty-text">No products available yet.</p>
                                ) : (
                                    productList.map((product) => (
                                        <div className="product-card" key={product.product_id || product.product_name}>
                                            <div className="product-card-image">
                                                {product.product_path ? (
                                                    <img src={product.product_path} alt={product.product_name} />
                                                ) : (
                                                    <div className="product-image-placeholder" aria-hidden="true" />
                                                )}
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
                                                        disabled={deleteLoading === product.product_id}
                                                    >
                                                        {deleteLoading === product.product_id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}