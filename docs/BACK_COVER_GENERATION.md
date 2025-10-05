# Back Cover Generation Feature

## Overview
The Cover Creator module now supports both front and back cover generation for books. Users can create professional back covers with book blurbs, author bios, ISBN, and pricing information.

## Features

### Cover Type Selection
- **Front Cover**: Traditional book cover with title, subtitle, and author name
- **Back Cover**: Professional back cover layout with blurb, author bio, ISBN, and price

### Back Cover Components

#### Required Fields
- **Book Blurb/Description**: The main marketing text that appears on the back cover

#### Optional Fields
- **Author Bio**: Brief biography of the author with "About the Author" heading
- **ISBN**: International Standard Book Number
- **Price**: Book retail price

### Layout and Design

#### Canvas Layout
- **Blurb**: Top section with 10% margin, left-aligned text
- **Author Bio**: Middle section with heading and italic text
- **ISBN**: Bottom left corner
- **Price**: Bottom right corner, bold text

#### Typography
- Blurb: 3.5% of canvas width font size
- Author Bio: 2.8% of canvas width font size
- Details: 2.5% of canvas width font size
- All text uses selected typography style from advanced options

#### Styling Options
- All front cover styling options apply to back covers
- Background colors, gradients, patterns, and borders
- Typography styles (serif, sans-serif, display, script, monospace)
- Layout options (patterns and borders)

### Generation Modes

#### AI-Powered Generation
The AI generates a professional back cover background that complements the book's genre and style:

```typescript
// Back cover AI prompt includes:
- Genre context from active project
- Style description (modern, classic, minimalist, etc.)
- Format specifications (ebook, paperback, hardback)
- Subtle background suitable for text overlay
```

#### Manual Creation
Generate a canvas-based back cover with custom colors and design elements without AI.

### Usage Example

```typescript
// 1. Select "Back Cover" type
setCoverType('back');

// 2. Enter required information
setBlurb('Your captivating book description...');

// 3. Add optional details
setAuthorBio('Author biography...');
setIsbn('978-0-00-000000-0');
setPrice('$9.99');

// 4. Choose style and format
setCoverStyle('modern');
setBookFormat('paperback');

// 5. Generate
handleGenerateAICover(); // or handleGenerateManualCover();
```

### File Naming Convention
Back covers are saved with the format:
```
book_[format]_back_cover.[extension]
```

Example: `book_paperback_back_cover.png`

### Export Formats
- **PNG**: High-quality transparent background support
- **JPG**: Smaller file size for digital use
- **PDF**: Print-ready format

## Technical Implementation

### Key Functions

#### `drawBackCover()`
Main rendering function for back cover layout:
- Text wrapping for blurb and bio
- Dynamic positioning based on content
- Consistent margin and spacing
- Professional typography

#### `handleGenerateAICover()`
Updated to support both cover types:
- Different prompts for front vs. back
- Validation based on cover type
- Appropriate error messages

#### `generateCanvasPreview()`
Conditional rendering:
- Front cover: title, subtitle, author
- Back cover: blurb, bio, ISBN, price

### State Management
New state variables added:
```typescript
const [coverType, setCoverType] = useState<CoverType>('front');
const [blurb, setBlurb] = useState('');
const [authorBio, setAuthorBio] = useState('');
const [isbn, setIsbn] = useState('');
const [price, setPrice] = useState('');
```

## Best Practices

### Blurb Writing
- Keep it concise (150-250 words)
- Focus on hook and main conflict
- End with compelling question or statement

### Author Bio
- Keep it brief (50-100 words)
- Include relevant credentials
- Personal touch without oversharing

### ISBN
- Use standard ISBN-13 format
- Include hyphens for readability

### Pricing
- Include currency symbol
- Consider market positioning
- Update for different regions

## Future Enhancements
- Barcode generation for ISBN
- Multiple back cover templates
- Automatic blurb generation using AI
- Review quotes integration
- Series information display
- QR code support for author website

## Troubleshooting

### Common Issues

**Text Overflows Canvas**
- Reduce blurb length
- Use smaller font size via CSS
- Check text wrapping logic

**Colors Don't Match Front Cover**
- Use "Apply Style Colors" button
- Manually sync color pickers
- Consider using the same style for both covers

**AI Generation Fails**
- Check API key configuration
- Verify custom prompt is not too complex
- Try manual generation as fallback

## Integration
The back cover feature integrates seamlessly with:
- Front cover generation
- All export formats
- All book formats (ebook, paperback, hardback)
- All style options
- Advanced typography and layout options
