import express from 'express';
import cors from 'cors';
import { Client, handle_file } from "@gradio/client"; // <-- Add handle_file
import fetch from 'node-fetch'; // Make sure you have node-fetch installed: npm i node-fetch
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS for all routes and origins
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

app.post('/generate-3d-model', async (req, res) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: "Please provide 'imageUrl' in the request body." });
    }

    try {
        const hftoken = process.env.HF_TOKEN; // Ensure you have set this environment variable
        const client = await Client.connect("trellis-community/TRELLIS", {hf_token: hftoken});
        if (!client) {
            throw new Error("Failed to connect to Gradio client.");
        }
        console.log("Connected to Gradio client.");

        // 2. Start a session
        console.log("Calling /start_session...");
        const sessionResult = await client.predict("/start_session", {});
        console.log("Session started:", sessionResult.data);

       
        // 5. Fetch the image from the provided URL
        console.log("Fetching image from URL...");
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }

        // const exampleImageBlob = await response.blob();
        // const exampleImageBuffer = await response.arrayBuffer();
        const exampleImageBuffer = Buffer.from(await response.arrayBuffer());
        console.log("Image fetched successfully.");

        // 6. Preprocess the image
        console.log("Calling /preprocess_image...");
        const preprocessResult = await client.predict("/preprocess_image", {
            image: handle_file(exampleImageBuffer), // Use handle_file to convert Blob to Gradio compatible format
        });
        console.log("Image preprocessed successfully:", preprocessResult.data);

        console.log("Fetching Processed image from URL - " + preprocessResult.data[0].url);
        const response2 = await fetch(preprocessResult.data[0].url);
        if (!response2.ok) {
            throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }

        // const exampleImageBlob = await response.blob();
        // const exampleImageBuffer = await response.arrayBuffer();
        const exampleImageBuffer2 = Buffer.from(await response2.arrayBuffer());
        console.log("Prepocessed Image fetched successfully.");

        // 7. Generate and extract GLB
        console.log("Calling /generate_and_extract_glb...");
        const generateResult = await client.predict("/generate_and_extract_glb", {
           image: handle_file(exampleImageBuffer2), // Use handle_file to convert Blob to Gradio compatible format
            multiimages: [], // Default as per docs
            seed: 0, // Default as per docs
            ss_guidance_strength: 7.5, // Default as per docs
            ss_sampling_steps: 12, // Default as per docs
            slat_guidance_strength: 3, // Default as per docs
            slat_sampling_steps: 12, // Default as per docs
            multiimage_algo: "stochastic", // Default as per docs
            mesh_simplify: 0.95, // Default as per docs
            texture_size: 1024, // Default as per docs
        });

        console.log("3D model generated successfully:", generateResult.data);
        console.log("3D model generation complete.");
        res.json({
            message: "3D model generation initiated successfully with session workflow.",
            data: generateResult.data
        });

    } catch (error) {
        console.error("Error during 3D model generation workflow:", error);
        res.status(500).json({ error: "Failed to generate 3D model.", details: error });
    }
});

//function to delete a 3D model
const delete3DModel = async (modelName) => {
    const modelPath = path.join(__dirname, '..', 'client', 'public', 'models', `${modelName}`);
    try {
        await fs.unlink(modelPath);
        console.log(`Model ${modelName} deleted successfully from ${modelPath}.`);
        return { success: true };
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Model not found for deletion: ${modelPath}`);
            return { success: false, status: 404, message: '3D model not found.' };
        }
        console.error(`Error deleting model ${modelName}:`, error);
        return { success: false, status: 500, message: 'Error deleting model file.' };
    }
};

app.delete('/delete-3d-model', async (req, res) => {
    try {
        const { modelName } = req.body;
        console.log("Received request to delete 3D model:", modelName);

        if (!modelName) {
            return res.status(400).json({ error: "Model name is required." });
        }

        // Call the appropriate function to delete the 3D model
        const result = await delete3DModel(modelName);

        if (result.success) {

            return res.json({ message: "3D model deleted successfully." });

        }

        
        return res.status(result.status).json({ error: result.message });
    } catch (error) {
        console.error("Error during 3D model deletion workflow:", error);
        res.status(500).json({ error: "Failed to delete 3D model.", details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});






// {
//     "message": "3D model generation initiated successfully with session workflow.",
//     "data": [
//         {
//             "video": {
//                 "path": "/tmp/gradio/0b445d5a2aaa69bba0e4d42aec6398d79b44a493c5daef1666d13f2f32d549f0/sample.mp4",
//                 "url": "https://trellis-community-trellis.hf.space/gradio_api/file=/tmp/gradio/0b445d5a2aaa69bba0e4d42aec6398d79b44a493c5daef1666d13f2f32d549f0/sample.mp4",
//                 "size": null,
//                 "orig_name": "sample.mp4",
//                 "mime_type": null,
//                 "is_stream": false,
//                 "meta": {
//                     "_type": "gradio.FileData"
//                 }
//             },
//             "subtitles": null
//         },
//         {
//             "path": "/tmp/gradio/c06104a21d76fa319a2d6daa2510e8ed57002c1b2c6bd49cbf76e47ac978633a/sample.glb",
//             "url": "https://trellis-community-trellis.hf.space/gradio_api/file=/tmp/gradio/c06104a21d76fa319a2d6daa2510e8ed57002c1b2c6bd49cbf76e47ac978633a/sample.glb",
//             "size": null,
//             "orig_name": "sample.glb",
//             "mime_type": null,
//             "is_stream": false,
//             "meta": {
//                 "_type": "gradio.FileData"
//             }
//         },
//         {
//             "path": "/tmp/gradio/c06104a21d76fa319a2d6daa2510e8ed57002c1b2c6bd49cbf76e47ac978633a/sample.glb",
//             "url": "https://trellis-community-trellis.hf.space/gradio_api/file=/tmp/gradio/c06104a21d76fa319a2d6daa2510e8ed57002c1b2c6bd49cbf76e47ac978633a/sample.glb",
//             "size": null,
//             "orig_name": "sample.glb",
//             "mime_type": null,
//             "is_stream": false,
//             "meta": {
//                 "_type": "gradio.FileData"
//             }
//         }
//     ]
// }