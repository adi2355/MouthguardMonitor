# Context Extractor Usage Examples

This document provides practical examples of how to use the context extractor script for different scenarios.

## Basic Usage Examples

### Analyze Current Project

To analyze the current project directory and output results to the default file (`code_context.txt`):

```bash
python context.py
```

### Analyze Specific Directory

To analyze a specific directory and save the output to a custom file:

```bash
python context.py my_analysis.txt --root-dir /path/to/your/react-native-project
```

### Change Output Format

Generate output in different formats:

```bash
# JSON format (useful for programmatic processing)
python context.py analysis.json --format json

# Markdown format (good for documentation)
python context.py analysis.md --format markdown

# HTML format (interactive visual report)
python context.py analysis.html --format html
```

## Analysis-Specific Examples

### Performance Analysis

To identify performance issues in your codebase:

```bash
python context.py --analyze-performance
```

This will detect issues like:
- Missing dependency arrays in useEffect hooks
- Inline function definitions in JSX
- Components that would benefit from memoization

### Component Hierarchy Visualization

To visualize the component hierarchy in your application:

```bash
python context.py --show-component-tree
```

This helps understand the relationship between components and their children.

### React Native Pattern Analysis

To identify React Native-specific issues:

```bash
python context.py --analyze-react-native
```

This will find issues like:
- Inline styles (should use StyleSheet)
- Missing platform-specific code
- Images without resizeMode
- Potential memory leaks in navigation event listeners

### Data Flow Analysis

To track state flow between components:

```bash
python context.py --analyze-data-flow
```

This shows:
- How state is passed between parent and child components
- Which API calls update which state variables

## Comprehensive Analysis

To perform a comprehensive analysis with all features enabled:

```bash
python context.py comprehensive_analysis.md --format markdown \
  --analyze-performance \
  --analyze-data-flow \
  --show-component-tree \
  --analyze-react-native
```

## Filtering Examples

### Exclude Specific Directories

To exclude specific directories from analysis (in addition to default exclusions):

```bash
python context.py --exclude test --exclude legacy
```

### Include Only Specific Directories

To focus analysis on specific directories only:

```bash
python context.py --include src/components --include src/screens
```

### Limit Output Size

To limit the size of the output report (for large codebases):

```bash
python context.py --max-lines 5000
```

## Common Workflow Examples

### Code Review Preparation

Before a code review, generate a comprehensive analysis:

```bash
python context.py review.md --format markdown --analyze-performance --analyze-react-native
```

### Performance Optimization

When focusing on performance optimization:

```bash
python context.py perf_issues.txt --analyze-performance --max-lines 1000
```

### Codebase Onboarding

For new team members to understand the codebase structure:

```bash
python context.py onboarding.html --format html --show-component-tree
```

### Refactoring Planning

When planning a refactoring effort:

```bash
python context.py refactor_plan.md --format markdown \
  --analyze-performance \
  --analyze-react-native \
  --analyze-data-flow
```

## Troubleshooting

### Files Not Being Processed

If certain files aren't being processed, check:

```bash
# Explicitly include the directory containing the files
python context.py --include path/to/files

# Increase processing capacity
python context.py --max-lines 30000 --max-file-size 2097152  # 2MB
```

### Script Taking Too Long

For large codebases, focus the analysis:

```bash
# Analyze only specific directories
python context.py --include src/core --include src/features

# Disable comprehensive analysis
python context.py --max-lines 10000
``` 