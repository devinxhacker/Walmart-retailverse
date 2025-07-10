// import express from 'express';
// import multer from 'multer';
// import { Client, handle_file } from '@gradio/client';

// const app = express();
// const port = process.env.PORT || 3000;

// // --- Middleware ---
// // For parsing application/json
// app.use(express.json());
// // For parsing application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));

// // Multer setup for file uploads in memory
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // --- Gradio Client Setup ---
// const GRADIO_APP_URL = "trellis-community/TRELLIS";
// const HF_TOKEN = "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"; // <-- Put your actual token here
// let client;

// /**
//  * A generic handler to make predictions to the Gradio app.
//  * @param {import('express').Request} req The Express request object.
//  * @param {import('express').Response} res The Express response object.
//  * @param {string} endpoint The API endpoint to call.
//  * @param {object} payload The payload for the prediction.
//  */
// const handlePrediction = async (req, res, endpoint, payload) => {
//     try {
//         console.log(`Received request for ${endpoint}`);
//         const result = await client.predict(endpoint, payload);
//         res.json(result.data);
//     } catch (error) {
//         console.error(`Error on endpoint ${endpoint}:`, error);
//         res.status(500).json({ error: 'An error occurred while processing your request.' });
//     }
// };

// // --- Route Definitions ---

// app.get('/', (req, res) => {
//     res.status(200).send('Gradio API server is running and connected to TRELLIS.');
// });

// // Endpoints with no parameters
// [
//     '/start_session',
//     '/lambda',
//     '/lambda_1',
//     '/lambda_2',
//     '/extract_gaussian',
//     '/lambda_4',
//     '/lambda_5',
//     '/lambda_3'
// ].forEach(endpoint => {
//     app.post(endpoint, (req, res) => handlePrediction(req, res, endpoint, {}));
// });

// // Endpoint for a single image upload
// app.post('/preprocess_image', upload.single('image'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: '`image` file is required.' });
//     }
//     const payload = {
//         image: handle_file(req.file.buffer)
//     };
//     await handlePrediction(req, res, '/preprocess_image', payload);
// });

// // Endpoint for a gallery of images (passed as JSON data)
// app.post('/preprocess_images', async (req, res) => {
//     const { images = [] } = req.body;
//     await handlePrediction(req, res, '/preprocess_images', { images });
// });

// // Endpoint with numeric and boolean parameters
// app.post('/get_seed', async (req, res) => {
//     const { randomize_seed, seed } = req.body || {};
//     const payload = {
//         randomize_seed: randomize_seed !== undefined ? Boolean(randomize_seed) : true,
//         seed: seed !== undefined ? Number(seed) : 0
//     };
//     await handlePrediction(req, res, '/get_seed', payload);
// });

// // Complex endpoint with file upload and multiple parameters
// app.post('/generate_and_extract_glb', upload.single('image'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: '`image` file is required.' });
//     }

//     try {
//         // Multer puts text fields in req.body. They will be strings.
//         const {
//             multiimages,
//             seed,
//             ss_guidance_strength,
//             ss_sampling_steps,
//             slat_guidance_strength,
//             slat_sampling_steps,
//             multiimage_algo,
//             mesh_simplify,
//             texture_size
//         } = req.body;

//         const payload = {
//             image: handle_file(req.file.buffer),
//             multiimages: multiimages ? JSON.parse(multiimages) : [],
//             seed: seed !== undefined ? Number(seed) : 0,
//             ss_guidance_strength: ss_guidance_strength !== undefined ? Number(ss_guidance_strength) : 7.5,
//             ss_sampling_steps: ss_sampling_steps !== undefined ? Number(ss_sampling_steps) : 12,
//             slat_guidance_strength: slat_guidance_strength !== undefined ? Number(slat_guidance_strength) : 3,
//             slat_sampling_steps: slat_sampling_steps !== undefined ? Number(slat_sampling_steps) : 12,
//             multiimage_algo: multiimage_algo || "stochastic",
//             mesh_simplify: mesh_simplify !== undefined ? Number(mesh_simplify) : 0.95,
//             texture_size: texture_size !== undefined ? Number(texture_size) : 1024
//         };
//         await handlePrediction(req, res, '/generate_and_extract_glb', payload);
//     } catch (error) {
//         if (error instanceof SyntaxError) {
//             console.error('Error parsing `multiimages` JSON:', error);
//             return res.status(400).json({ error: 'Invalid JSON format for `multiimages` field.' });
//         }
//         // Delegate to the generic error handler
//         handlePrediction(req, res, '/generate_and_extract_glb', {});
//     }
// });

// // --- Server Initialization ---

// const startServer = async () => {
//     try {
//         console.log(`Connecting to Gradio app: ${GRADIO_APP_URL}...`);
//         client = await Client.connect(GRADIO_APP_URL, { hf_token: HF_TOKEN }); // Pass token here
//         console.log("✅ Successfully connected to Gradio app.");

//         app.listen(port, () => {
//             console.log(`🚀 Server listening at http://localhost:${port}`);
//         });
//     } catch (error) {
//         console.error("❌ Failed to connect to Gradio app:", error);
//         process.exit(1);
//     }
// };

// startServer();



// app.js
import express from 'express';
import { Client, handle_file } from "@gradio/client"; // <-- Add handle_file
import fetch from 'node-fetch'; // Make sure you have node-fetch installed: npm i node-fetch

const app = express();
const port = 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

app.post('/generate-3d-model', async (req, res) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: "Please provide 'imageUrl' in the request body." });
    }

    try {
        const client = await Client.connect("trellis-community/TRELLIS", {
            hf_token: process.env.HF_TOKEN // <-- Use your actual token here
        });
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