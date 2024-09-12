import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port =  3000;
const API_URL = `http://localhost:8000`;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

let blood_bank_id;
let auth = false;

app.listen(port, () => {
    console.log(`Website running on http://localhost:${port}`);
})

// Home Page
app.get("/", (req,res)=>{
    res.render("home.ejs", {auth: auth});
})

let banks;

// Create New User Route
app.get("/create", async (req, res)=>{
    const response = (await axios.get(`${API_URL}/new-user`)).data;
    banks = response;
    console.log(banks);
    res.render("create_user.ejs",{banks: banks});
})

app.post("/create", async (req, res)=>{
    const data = req.body;
    console.log(data);
    if(data.password !== data.re_password)
    {
        res.render("create_user.ejs",{banks: banks, error: "Passwords do not match, try again."});
    }
    else
    {
        const response = (await axios.post(`${API_URL}/new-user`, data)).data;
        console.log(response);
        if(response.error)
        {
            res.render("create_user.ejs",{banks: banks, error: response.error});
        }
        else
        {
            res.render("login.ejs",{message: "New User Created!"});
        }
    }
})

// Login Route
app.get("/login", (req, res)=>{
    console.log("auth: "+auth);
    if(auth)
    {
        blood_bank_id = -1;
        auth = false;
        res.render("login.ejs", {message: "Successfully Logged Out"});
    }
    else
    {
        res.render("login.ejs");
    }
})

app.post("/login", async (req, res)=>{
    const response = (await axios.post(`${API_URL}`, req.body)).data;
    console.log(response);
    
    if(response.error)
    {
        res.render("login.ejs",{message: response.error});
    }
    else
    {
        blood_bank_id = response[0].id;
        auth = true;
        res.redirect("/");
    }
    
})

// Crreate New Blood Bank oute
app.get("/register", (req, res)=>{
    if(!auth)
    {
        res.render("create_bank.ejs");
    }
})

app.post("/register", async (req, res)=>{
    if(!auth)
    {
        const data = req.body;
        const response = (await axios.post(`${API_URL}/new-bloodbank`, data)).data;
        if(response.error)
        {
            res.render("create_bank.ejs",{message: response.error});
        }
        else
        {
            res.render("create_bank.ejs",{message: "Blood Bank Registered Successfully"});
    }
    }
})

app.get("/stock", async (req, res)=>{
    if(auth)
    {   
        console.log("bb id: "+blood_bank_id);
        const response = (await axios.post(`${API_URL}/all-stock`, {blood_bank_id: blood_bank_id} )).data;
        console.log(response);
        res.render("excess_stock.ejs", {data: response});
    }
    else
    {
        res.redirect("/login")
    }
})

// Get user stock
app.get("/user-stock", async (req, res)=>{
    if(auth)
    {
        const response = (await axios.post(`${API_URL}/user-stock`, {blood_bank_id: blood_bank_id} )).data;
        res.render("your_stock.ejs", {stock: response});
    }
    else
    {
        res.redirect("/login")
    }
})

// Add Stock
app.post("/user-stock", async (req, res)=>{
    if(auth)
    {
        console.log(req.body);
        const response = (await axios.post(`${API_URL}/stock`, {blood_bank_id: blood_bank_id, stock: req.body} )).data;
        console.log(response);
        res.redirect("/user-stock");
    }
})

// Delet Stock
app.get("/delete/:id", async (req, res)=>{
    if(auth)
    {
        console.log("id: "+req.params.id);
        const id = req.params.id;
        try{
            const response = await axios.delete(`${API_URL}/stock/${id}`)
        }
        catch(error)
        {
            console.log("error");
        }
        res.redirect("/user-stock");
    }
    else
    {
        res.redirect("/login")
    }
})

app.get("*", (req, res)=>{
    res.render("404.ejs", {auth: auth})
})
