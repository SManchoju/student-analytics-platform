import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, UpdateCommand } 
from "@aws-sdk/lib-dynamodb";
import Fuse from 'fuse.js';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;
// Initialize Amazon DynamoDB Connection Layer
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "StudentsPlatform";
// 1. ADMIN USER AUTHENTICATION ENDPOINT
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password123') {
        return res.status(200).json({ success: true, token: "secure-mock-session-key" });
    }
    return res.status(401).json({ success: false, message: "Invalid credentials" });
});
// 2. QUERY RECORDS WITH INTEGRATED BACKEND FUZZY SEARCH & MAX-10 PAGINATION
app.get('/api/students', async (req, res) => {
    try {
        const { search, page = 1 } = req.query;
        const limit = 10; 
        // Scan full remote database item map rows
        const command = new ScanCommand({ TableName: TABLE_NAME });
        const response = await docClient.send(command);
        let students = response.Items || [];
        // Apply Mandatory Fuzzy Search Engine
        if (search && search.trim() !== '') {
            const fuse = new Fuse(students, {
                keys: ['name'],
                threshold: 0.4 // Bitwise tolerance limit for typos
            });
            const searchResults = fuse.search(search);
            students = searchResults.map(result => result.item);
        }
        // Apply Dataset Pagination Bounds
        const totalItems = students.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedStudents = students.slice(startIndex, endIndex);
        res.json({
            students: paginatedStudents,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: parseInt(page),
            totalRecords: totalItems
        });
    } catch (error) {
        console.error("DynamoDB Scan Error:", error);
        res.status(500).json({ error: "Failed to fetch student data." });
    }
});
// 3. CREATE DATA RECORD
app.post('/api/students', async (req, res) => {
    try {
        const { name, age, current_class, marks } = req.body;
        const newStudent = {
            id: "STU_" + Date.now(),
            name,
            age: parseInt(age),
            current_class,
            marks: marks || {
                "Telugu": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, 
"June": 0 },
                "Hindi": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, 
"June": 0 },
                "English": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 
0, "June": 0 },
                "Social Studies": { "January": 0, "February": 0, "March": 0, "April": 0, 
"May": 0, "June": 0 }
            }
        };
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: newStudent
        }));
        res.status(201).json({ success: true, student: newStudent });
    } catch (error) {
        res.status(500).json({ error: "Failed to create student record." });
    }
});
// 4. UPDATE EXISTING PROFILE & GRADES
app.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, current_class, marks } = req.body;
         const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: "set #n = :name, age = :age, current_class = :cc, marks = :marks",
            ExpressionAttributeNames: { "#n": "name" },
            ExpressionAttributeValues: {
                ":name": name,
                ":age": parseInt(age),
                ":cc": current_class,
                ":marks": marks
            },
            ReturnValues: "ALL_NEW"
        });
        const response = await docClient.send(command);
        res.json({ success: true, student: response.Attributes });
    } catch (error) {
        res.status(500).json({ error: "Failed to update student record." });
    }
});
// 5. REMOVE RECORD WITH SAFE CASCADE
app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id }
        }));
        res.json({ success: true, message: "Student deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete student record." });
    }
});
app.listen(PORT, () => console.log(`Backend Active Server Running On Port ${PORT}`));