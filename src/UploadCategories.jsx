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
            alert("Please fill all fields and upload an image");
            return;
        }

        const formdata = new FormData();
        formdata.append('description', description);
        formdata.append('product_name', product_name);
        formdata.append('price', price);
        formdata.append('file', file);

        try{
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(`${apiUrl}/addcategory.php`, {
                method: 'POST',
                body: formdata
        });
        const data = await response.json();
        if(data.status === 'success'){
            alert("Success: " + data.message);
            setProductName("");
            setDescription("");
            setPrice("");
            setFile(null);
            setPreview(null);
        }else{
            alert(data.message);
        }
        }
        catch(error){
            alert("Unable to communicate with the server. Please try again later.");
        }
    }

    useEffect(() => {
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
                        <Link to="/categories"><button type="button" className="btn btn-secondary">View Categories</button></Link>
                    </div>
                </form>
            </div>
        </div>
    )
}