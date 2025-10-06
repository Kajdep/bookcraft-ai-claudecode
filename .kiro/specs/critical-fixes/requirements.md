# Requirements Document

## Introduction

This document outlines the requirements for fixing critical issues in the BookCraft AI application before production launch on Vercel. The application is nearly ready for production but has several key issues that need to be addressed: autosave functionality is not working, the dark mode color scheme has visibility issues with grey areas, the theme toggle button is non-functional, and the Material, KDP Calculator, and Export features are not yet implemented.

**Deployment Context:** The application will be deployed on Vercel as a static site with serverless functions. All solutions must be compatible with Vercel's serverless architecture, edge runtime constraints, and static site generation capabilities.

## Requirements

### Requirement 1: Implement Functional Autosave System

**User Story:** As a writer, I want my work to be automatically saved at regular intervals, so that I don't lose my progress if the browser crashes or I accidentally close the tab.

#### Acceptance Criteria

1. WHEN a user makes changes to chapter content THEN the system SHALL automatically save the changes after 2 seconds of inactivity
2. WHEN autosave is triggered THEN the system SHALL display a visual indicator showing "Saving..." status
3. WHEN autosave completes successfully THEN the system SHALL display "Saved" with a timestamp
4. WHEN autosave fails THEN the system SHALL display an error message and retry after 5 seconds
5. IF the user is offline THEN the system SHALL save changes to IndexedDB and sync to Supabase when connection is restored
6. WHEN the user manually saves THEN the system SHALL immediately persist all pending changes to both IndexedDB and Supabase
7. WHEN multiple projects are open THEN the system SHALL track autosave state independently for each project
8. WHEN deployed on Vercel THEN the autosave system SHALL work entirely client-side without requiring serverless functions
9. WHEN saving to Supabase THEN the system SHALL use the existing Supabase client configuration
10. WHEN the browser tab is closed THEN the system SHALL attempt to save any pending changes using beforeunload event

### Requirement 2: Fix Dark Mode Color Scheme Issues

**User Story:** As a user working in dark mode, I want all UI elements to have proper contrast and visibility, so that I can comfortably use the application without straining my eyes.

#### Acceptance Criteria

1. WHEN dark mode is active THEN all grey areas SHALL be replaced with appropriate dark theme colors
2. WHEN viewing modals in dark mode THEN the background SHALL be dark grey (#1f2937) with proper contrast
3. WHEN viewing input fields in dark mode THEN they SHALL have dark backgrounds (#374151) with light text
4. WHEN viewing buttons in dark mode THEN they SHALL have appropriate hover states with visible feedback
5. WHEN viewing cards and panels in dark mode THEN they SHALL use consistent dark theme colors (#111827, #1f2937, #374151)
6. WHEN viewing text in dark mode THEN all text SHALL have sufficient contrast (WCAG AA minimum)
7. WHEN viewing borders in dark mode THEN they SHALL use dark grey tones (#374151) instead of light grey

### Requirement 3: Fix Theme Toggle Functionality

**User Story:** As a user, I want to switch between light and dark modes using the theme toggle button, so that I can choose the appearance that suits my preference and environment.

#### Acceptance Criteria

1. WHEN the user clicks the theme toggle button THEN the theme SHALL immediately switch between light and dark modes
2. WHEN the theme changes THEN the system SHALL persist the preference to localStorage
3. WHEN the user reloads the page THEN the system SHALL restore the previously selected theme
4. WHEN the theme changes THEN all UI components SHALL update their colors accordingly
5. WHEN in light mode THEN the toggle button SHALL display a moon icon
6. WHEN in dark mode THEN the toggle button SHALL display a sun icon
7. WHEN the theme changes THEN the HTML document SHALL have the 'dark' class added or removed appropriately

### Requirement 4: Implement Material Management Features

**User Story:** As a writer, I want to organize and manage reference materials, images, links, and notes related to my book project, so that I can keep all my research and inspiration in one place.

#### Acceptance Criteria

1. WHEN the user navigates to the Materials tab THEN they SHALL see a list of all materials organized by folders
2. WHEN the user clicks "Add Material" THEN they SHALL see options to add: Note, Document, Image, Link, Audio, Video
3. WHEN the user adds a note THEN they SHALL be able to enter a title and rich text content
4. WHEN the user uploads a file THEN the system SHALL store it in IndexedDB (for files < 5MB) or Supabase Storage (for larger files) and display a thumbnail
5. WHEN the user adds a link THEN the system SHALL validate the URL and optionally fetch metadata
6. WHEN the user creates a folder THEN they SHALL be able to organize materials hierarchically
7. WHEN the user tags materials THEN they SHALL be able to filter and search by tags
8. WHEN the user links a material to a chapter THEN it SHALL appear in the chapter's reference section
9. WHEN the user bookmarks a material THEN it SHALL appear in the bookmarks quick access list
10. WHEN the user deletes a material THEN the system SHALL confirm and remove it from storage

### Requirement 5: Implement KDP Calculator Features

**User Story:** As a self-publishing author, I want to calculate my potential royalties and pricing for Amazon KDP, so that I can make informed decisions about my book's pricing strategy.

#### Acceptance Criteria

1. WHEN the user navigates to the KDP Calculator tab THEN they SHALL see input fields for book details
2. WHEN the user enters page count THEN the system SHALL calculate printing costs based on KDP rates
3. WHEN the user enters a list price THEN the system SHALL calculate royalties for both 35% and 70% options
4. WHEN the user selects a marketplace THEN the system SHALL adjust calculations for that region's rates
5. WHEN the user selects color vs black & white THEN the system SHALL adjust printing costs accordingly
6. WHEN the user selects paperback vs hardcover THEN the system SHALL use appropriate cost formulas
7. WHEN calculations are complete THEN the system SHALL display: printing cost, royalty per sale, break-even price
8. WHEN the user changes any input THEN the system SHALL immediately recalculate all values
9. WHEN the user clicks "Save Calculation" THEN the system SHALL store it with the project
10. WHEN the user views saved calculations THEN they SHALL see a history of pricing scenarios

### Requirement 6: Implement Export Functionality

**User Story:** As a writer, I want to export my completed manuscript in various formats (DOCX, PDF, EPUB), so that I can submit it to publishers, share it with beta readers, or publish it myself.

#### Acceptance Criteria

1. WHEN the user navigates to the Export tab THEN they SHALL see export format options: DOCX, PDF, EPUB
2. WHEN the user selects DOCX export THEN the system SHALL generate a properly formatted Word document using client-side libraries (docx.js)
3. WHEN the user selects PDF export THEN the system SHALL generate a PDF using client-side libraries (jsPDF) with proper formatting and page breaks
4. WHEN the user selects EPUB export THEN the system SHALL generate a valid EPUB file using client-side libraries (epub-gen-memory) for e-readers
5. WHEN exporting THEN the user SHALL be able to choose which chapters to include
6. WHEN exporting THEN the user SHALL be able to include/exclude metadata (title page, table of contents)
7. WHEN exporting THEN the user SHALL be able to include/exclude generated images and visuals
8. WHEN export is complete THEN the system SHALL trigger a file download with appropriate filename
9. WHEN export fails THEN the system SHALL display a clear error message with troubleshooting steps
10. WHEN exporting large manuscripts THEN the system SHALL show a progress indicator
11. WHEN exporting to DOCX THEN the system SHALL preserve formatting: bold, italic, headings, lists
12. WHEN exporting to PDF THEN the system SHALL include page numbers and proper margins
13. WHEN exporting to EPUB THEN the system SHALL include proper metadata and chapter navigation


### Requirement 7: Production Deployment Considerations

**User Story:** As a product owner, I want the application to work reliably on Vercel's infrastructure, so that users have a fast, stable experience without backend complexity.

#### Acceptance Criteria

1. WHEN the application is deployed to Vercel THEN all features SHALL work without requiring custom server code
2. WHEN using Supabase THEN the system SHALL use environment variables for API keys and endpoints
3. WHEN generating exports THEN the system SHALL process files entirely client-side to avoid serverless function timeouts
4. WHEN storing files THEN the system SHALL use Supabase Storage for files > 5MB to avoid IndexedDB quota limits
5. WHEN the application loads THEN it SHALL initialize within 3 seconds on a standard broadband connection
6. WHEN users access the site THEN it SHALL be served from Vercel's edge network for optimal performance
7. WHEN API keys are configured THEN they SHALL be stored securely in the user's browser, not in the codebase
8. WHEN the application updates THEN Vercel SHALL automatically deploy changes from the main branch
