# Video Display Fixes - Implementation Todo List

## Summary
Fix black spaces on video sides and height issues in the MediaModal component by updating CSS styles.

## Files to Modify

### 1. `src/components/viewer/MediaModal/MediaModal.module.css`
**Changes needed:**
1. Change `.media` class from `object-fit: contain` to `object-fit: cover`
2. Remove or adjust fixed `min-height` values for better responsiveness
3. Add video-specific styles for full coverage

**Current problematic CSS (lines 72-76):**
```css
.media {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;  /* CHANGE TO 'cover' */
}
```

**Current container constraints (lines 62, 69):**
```css
.mediaArea {
  /* ... */
  min-height: 400px;  /* CONSIDER REMOVING OR MAKING FLEXIBLE */
}

.imageWrap {
  /* ... */
  min-height: 500px;  /* CONSIDER REMOVING OR MAKING FLEXIBLE */
}
```

### 2. `src/components/viewer/MediaModal/MediaModal.tsx` (Optional)
**Changes needed:**
1. Ensure video element has proper width/height attributes
2. Consider adding inline styles for full coverage

**Current video element (lines 69-75):**
```tsx
<video
  src={post.mediaUrl}
  className={styles.media}
  autoPlay
  controls
  playsInline
  /* ADD: style={{ width: '100%', height: '100%' }} IF NEEDED */
/>
```

## Implementation Steps

### Step 1: Update CSS for Object-Fit
- Change `object-fit: contain` to `object-fit: cover` in `.media` class
- This eliminates black bars by filling the container

### Step 2: Improve Container Responsiveness
- Remove or reduce `min-height: 400px` from `.mediaArea`
- Remove or reduce `min-height: 500px` from `.imageWrap`
- Add flexible height: `height: 100%` or `min-height: auto`

### Step 3: Add Video-specific Optimization
- Optionally add separate styles for video elements:
  ```css
  video.media {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  ```

### Step 4: Test Different Scenarios
1. Portrait videos (9:16 aspect ratio)
2. Landscape videos (16:9 aspect ratio)  
3. Square videos (1:1 aspect ratio)
4. Mobile responsiveness

## Expected Results
- Videos fill entire modal container without black bars
- Video controls remain accessible
- Different aspect ratios display correctly
- Mobile responsiveness maintained
- Image display unaffected

## Testing Checklist
- [ ] Open MediaModal with video post
- [ ] Verify no black bars on sides
- [ ] Verify video fills container height properly
- [ ] Test with different video aspect ratios
- [ ] Verify mobile responsiveness
- [ ] Check that image posts still display correctly

## Rollback Plan
If issues arise:
1. Revert `object-fit: cover` back to `contain`
2. Restore original `min-height` values
3. Test alternative approach with aspect ratio preservation