# React Native Codebase Context Extractor

A powerful analysis tool for React Native and TypeScript codebases that extracts structured context and insights about components, hooks, services, API endpoints, navigation, and more.

## Features

- **Component Analysis**: Extracts React components (both functional and class-based) with props, hooks usage, and complexity metrics
- **Component Hierarchy**: Visualizes parent-child relationships between components
- **State Management Tracking**: Tracks state flow between components via props
- **Performance Analysis**: Identifies potential performance issues in components
- **React Native-Specific Analysis**: Detects common React Native anti-patterns
- **API & Data Flow Tracking**: Traces data flow from API calls to component state
- **Custom Hooks Analysis**: Finds optimization opportunities in custom hooks
- **Multiple Output Formats**: Generates reports in text, JSON, Markdown, or HTML formats

## Installation

No additional dependencies are required. The script uses Python's standard library.

```bash
# Download the script
# No installation needed, the script is self-contained
```

## Usage

```bash
python context.py [output_file] [options]
```

### Basic Usage

```bash
# Analyze the current directory and output to code_context.txt
python context.py

# Analyze a specific directory and output to a specific file
python context.py output.txt --root-dir ./my-react-native-app

# Generate a JSON output
python context.py output.json --format json
```

### Advanced Options

```bash
# Include performance analysis
python context.py --analyze-performance

# Include data flow analysis
python context.py --analyze-data-flow

# Show component hierarchy tree
python context.py --show-component-tree

# Include React Native specific analysis
python context.py --analyze-react-native

# Combine multiple analysis options
python context.py --analyze-performance --analyze-react-native --format markdown

# Exclude specific directories
python context.py --exclude node_modules --exclude .git

# Include only specific directories
python context.py --include src --include app
```

### All Available Options

| Option | Description |
|--------|-------------|
| `output_file` | Output file path (default: code_context.txt) |
| `--root-dir`, `-d` | Root directory to process (default: current directory) |
| `--exclude`, `-e` | Additional directories to exclude (can be used multiple times) |
| `--include`, `-i` | Additional directories to include (can be used multiple times) |
| `--max-lines`, `-m` | Maximum number of lines in output (default: 15000) |
| `--format`, `-f` | Output format: text, json, markdown, or html (default: text) |
| `--analyze-performance`, `-p` | Include performance analysis |
| `--analyze-data-flow`, `-df` | Include data flow analysis |
| `--show-component-tree`, `-t` | Include component hierarchy tree |
| `--analyze-react-native`, `-rn` | Include React Native specific analysis |

## Example Output

### Component Complexity

```
# COMPONENT COMPLEXITY
==================================================================================

| Component | Complexity | File |
|-----------|------------|------|
| HomeScreen | 18 | src/screens/HomeScreen.tsx |
| ProductDetail | 15 | src/screens/ProductDetail.tsx |
| ShoppingCart | 12 | src/components/ShoppingCart.tsx |

### Complexity Guidelines

- 0-5: Low complexity - Simple, well-structured component
- 6-10: Medium complexity - Moderately complex, still maintainable
- 11-20: High complexity - Complex component that may need refactoring
- 21+: Very high complexity - Component that should be refactored
```

### Component Hierarchy

```
# COMPONENT HIERARCHY
==================================================================================

## HomeScreen
- ProductList
- SearchBar
- FilterMenu

## ProductDetail
- ImageGallery
- ProductInfo
- AddToCartButton
```

### Performance Issues

```
# PERFORMANCE ISSUES
==================================================================================

## Component 'ProductList' has useEffect without dependency array
Components affected:
- ProductList

## Component 'SearchBar' has 3 inline functions in JSX
Components affected:
- SearchBar
```

### React Native Issues

```
# REACT NATIVE ISSUES
==================================================================================

## Component 'ProductCard' has 5 inline styles that should use StyleSheet
Components affected:
- ProductCard
- ProductDetail

## Component 'HomeScreen' has Image without resizeMode specified
Components affected:
- HomeScreen
```

## Interpreting The Results

The output provides several sections to help you understand your codebase:

1. **Component Complexity** - Identifies complex components that might need refactoring
2. **Component Hierarchy** - Shows parent-child relationships between components
3. **Performance Issues** - Highlights potential performance bottlenecks
4. **React Native Issues** - Points out React Native-specific best practices violations
5. **Data Flow Analysis** - Shows how state flows between components
6. **Navigation Routes** - Maps out your app's navigation structure
7. **Custom Hooks** - Lists all custom hooks with their usage patterns
8. **API Endpoints** - Catalogs all API endpoints used in your services

## License

This script is provided as-is under the MIT License.
