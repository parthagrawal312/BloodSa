import express, { response } from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port =  8000;
const db = new pg.Client({
    host: "localhost",
    port: 5432,
    user: "parthagrawal",
    password: "",
    database: "parthagrawal"
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
})

// Login Route
app.post("/", async (req, res)=>{
    const data = req.body;
    console.log(data);
    let error = "Incorrect username or password";
    let blood_bank;
    try{
        const response = await db.query("SELECT * FROM authentication WHERE username = $1", [data.username]);
        const credentials = response.rows[0];
        console.log(credentials);
        if(credentials.password == data.password)
        {
            const response = await db.query("SELECT * FROM blood_bank WHERE id = $1", [credentials.bank_id]);
            blood_bank = response.rows;
            error = "";
        }
    }
    catch(err)
    {
        console.log(err);
    }

    if(error)
        res.json({error: error});
    else
        res.json(blood_bank);

    
})

// Create User Route
app.get("/new-user", async (req, res)=>{
    let blood_banks;
    try{
        const response = await db.query("SELECT name, id FROM blood_bank;");
        blood_banks = response.rows;
    }
    catch(error)
    {
        console.log(error);
    }
    console.log(blood_banks);
    res.json(blood_banks);
})

app.post("/new-user", async (req, res)=>{
    const data = req.body;
    let error = "username not available";
    let user;
    console.log(data);
    try{
        const response = await db.query("INSERT INTO authentication VALUES($1, $2, $3) RETURNING *", [data.username, data.password, data.bank_id]);
        error = "";
        user = response.rows;
    }
    catch(error){
        console.log(error);
    }

    if(error)
        res.json({error: error});
    else
        res.json(user);
})

// Create Blood Bank Route
app.post("/new-bloodbank", async (req, res)=>{
    const data = req.body;
    let blood_bank;
    let error = "contact details already registered";
    try{
        const response = await db.query("INSERT INTO blood_bank(name, contact) VALUES($1, $2) RETURNING *", [data.name, data.contact]);
        blood_bank = response.rows;
        error = "";
    }
    catch(error)
    {
        console.log(error);
    }
    
    if(error)
    res.json({error: error});
else
        res.json(blood_bank);
})

// Get All other Blood Stock Route
app.post("/all-stock", async (req, res)=>{
    const id = req.body.blood_bank_id;
    const list = [];
    try{
        const response = await db.query("SELECT * FROM blood_bank WHERE id != $1", [id]);
        const blood_banks = response.rows;
        console.log(blood_banks);
        try{
            for(const blood_bank of blood_banks){
                const stock = await db.query("SELECT * FROM stock WHERE bank_id = $1", [blood_bank.id]);
                if(stock.rows.length != 0)
                {
                    const data = {
                        name: blood_bank.name,
                        contact: blood_bank.contact,
                        stock: stock.rows
                    };
                    list.push(data);
                }
            }
        }
        catch(error){
            console.log(error);
        }
    }
    catch(error){
        console.log(error);
    }
    console.log(list)
    res.json(list);
})

// Get Specfic BLood Bank stock
app.post("/user-stock", async (req, res)=>{
    const id = req.body.blood_bank_id;
    console.log(id);
    let response;
    try{
        response = (await db.query("SELECT * FROM stock WHERE bank_id = $1", [id])).rows;
    }
    catch(error)
    {
        console.log(error);
    }
    
    res.json(response);
})

// Add Blood Stock Route
app.post("/stock", async (req, res)=>{
    const data = req.body;
    const bank_id = data.blood_bank_id;
    const item = data.stock;
    console.log(data);
    let response;
    try{
        response = await db.query("INSERT INTO stock(blood_group, quantity, collection_date, volume, bag_type, expiry_date, bank_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *", 
        [item.blood_group, item.quantity, item.collection_date, item.volume, item.bag_type, item.expiry_date, bank_id]);
            
    }
    catch(error)
    {
        console.log(error);
    }

    res.json(response);
})

// Delete Blood Stock Route
app.delete("/stock/:id", async (req, res)=>{
    const id = req.params.id;
    let response;
    try{
        response = await db.query("DELETE FROM stock WHERE id = $1 RETURNING *", [id]);
    }
    catch(error)
    {
        console.log(error);
    }
    res.json(response);
})