# How to Upload Videos to Cloudinary

## Step 1: Get Your Video File
1. Download your video from YouTube (or use your original video file)
2. Make sure it's in a common format (MP4, MOV, etc.)

## Step 2: Upload to Cloudinary

### Option A: Using Cloudinary Media Library (Easiest)
1. Go to https://cloudinary.com/console
2. Click on **Media Library** in the left sidebar
3. Click **Upload** button (top right)
4. Select your video file
5. **Important**: Set the **Public ID** to: `listings/distillery-loft-tour`
   - You can set this in the upload dialog
   - Or rename it after upload in the Media Library
6. Click **Upload**

### Option B: Using Cloudinary Upload Widget (For Future Implementation)
We can add an upload widget directly in the app if needed.

## Step 3: Verify Your Video
After uploading, your video should be accessible at:
- Public ID: `listings/distillery-loft-tour`
- Full URL: `https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/listings/distillery-loft-tour`

## Step 4: Video Transformations & Text Overlays

Once uploaded, the video will automatically have these Cloudinary features applied:

### Available Modes:
1. **Full Tour** - Clean video with HD optimization
2. **AI Preview** - 5-second highlight clip (auto-generated)
3. **Branded Overlay** - Adds listing title + price at bottom
4. **Watermarked** - Adds listing name in corner
5. **Centered Title** - Large centered title overlay

### Text Overlays:
All text overlays are applied on-the-fly by Cloudinary:
- No video editing software needed
- Text is dynamically added based on listing data
- All transformations happen in real-time via Cloudinary's API

## Current Listing Setup:
- **Listing #4** uses: `listings/distillery-loft-tour`
- Update the `videoTour` field in `src/app/listings/[id]/page.tsx` to change which listing has a video

## Need Help?
- Cloudinary Docs: https://cloudinary.com/documentation
- Video Transformations: https://cloudinary.com/documentation/video_transformations
