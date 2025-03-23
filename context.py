#!/usr/bin/env python3
"""
Context Extractor for React Native/TypeScript Cannabis Recommendation Codebase

This script extracts structured context from a React Native/TypeScript codebase, focusing on:
- React component definitions and props
- Hooks and their usage
- Service classes and methods
- API endpoints and connections
- TypeScript interfaces and types
- State management patterns

Usage:
  python context_extractor.py [output_file]
"""

import os
import re
import sys
import json
import argparse
from typing import List, Dict, Tuple, Any, Optional, Set
from collections import defaultdict
import datetime

# Configuration
DEFAULT_CONFIG = {
    "extensions": [".tsx", ".ts", ".js", ".jsx", ".json"],
    "exclude_dirs": [
        "node_modules", "__tests__", "coverage", "build", "dist", "android", "ios",
        ".expo", ".expo-shared", ".git", ".github", "web-build"
    ],
    "exclude_files": [
        ".test.", ".spec.", ".min.js", ".map", "setup.js",
        ".gitignore", "package-lock.json", ".env"
    ],
    "include_dirs": [
        "app", "src"
    ],
    "max_file_size": 1024 * 1024,  # 1MB
    "max_lines": 15000,  # Target maximum lines for output
    "analyze_performance": False,   # Whether to analyze performance issues
    "analyze_data_flow": False,     # Whether to analyze data flow
    "show_component_tree": False,   # Whether to show component hierarchy tree
    "analyze_react_native": False   # Whether to include React Native specific analysis
}

class CodeContextExtractor:
    """Extracts structured context from a React Native/TypeScript codebase"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.component_props = {}
        self.hooks = []
        self.services = []
        self.api_endpoints = []
        self.interfaces = {}
        self.state_management = []
        self.navigation_routes = []
        self.file_summaries = []
        self.total_lines = 0
        # Add tracking structures
        self.component_hierarchy = defaultdict(set)  # Parent -> Children
        self.hook_usages = defaultdict(set)  # Component -> Hooks used
        self.api_calls = defaultdict(set)  # Component/Hook -> API services called
        self.component_complexity = []  # Track complex components
        self.files = []  # Track all processed files
        self.performance_issues = []  # Track performance issues
        self.react_native_issues = []  # Track React Native specific issues
        self.state_flows = {}  # Track state flows between components
        self.api_flows = {}  # Track API data flows
        self.database_schemas = []  # Track database schemas
        # New tracking properties for enhanced analysis
        self.import_dependencies = []  # Track module dependencies
        self.complex_types = []  # Track complex type relationships
        self.enhanced_api_endpoints = []  # Enhanced API endpoint documentation
        self.prop_flows = []  # Track component prop flows
        self.style_patterns = []  # Track styling patterns
        self.hook_usages_analysis = []  # Enhanced hook usage analysis
        self.enhanced_navigation = []  # Enhanced navigation route analysis
        self.security_patterns = []  # Security pattern analysis
    
    def should_exclude_file(self, file_path: str) -> bool:
        """Check if a file should be excluded based on config"""
        normalized_path = os.path.normpath(file_path)
        
        # Check excluded patterns
        for pattern in self.config["exclude_files"]:
            if pattern in normalized_path:
                return True
        
        # Check file extension        
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in self.config["extensions"]:
            return True
            
        return False

    def should_exclude_dir(self, dir_path: str) -> bool:
        """Check if a directory should be excluded based on config"""
        normalized_path = os.path.normpath(dir_path)
        dir_name = os.path.basename(normalized_path)
        
        # Check if the directory name itself is in the exclude list
        if dir_name in self.config["exclude_dirs"]:
            print(f"Excluding directory (name match): {normalized_path}")
            return True
            
        # Check if the path contains any of the excluded directory patterns
        for exclude_dir in self.config["exclude_dirs"]:
            if exclude_dir in normalized_path:
                print(f"Excluding directory (path match): {normalized_path} - matched: {exclude_dir}")
                return True
        
        # If we have include_dirs, check if this is in it
        if self.config["include_dirs"]:
            for include_dir in self.config["include_dirs"]:
                if include_dir in normalized_path:
                    return False
            # If not in any include_dirs, exclude it
            return True
                
        return False

    def collect_files(self, root_dir: str) -> List[Tuple[str, str]]:
        """Collect all eligible files in the directory"""
        results = []
        print(f"Collecting files from: {root_dir}")
        print(f"Exclusion patterns: {self.config['exclude_dirs']}")
        
        for root, dirs, files in os.walk(root_dir):
            # Process directories
            dirs_before = len(dirs)
            dirs[:] = [d for d in dirs if not self.should_exclude_dir(os.path.join(root, d))]
            if dirs_before > len(dirs):
                print(f"  In {root}: Filtered out {dirs_before - len(dirs)} directories")
            
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_dir)
                
                # Check exclusion patterns
                if self.should_exclude_file(rel_path):
                    continue
                    
                # Check file size
                if os.path.getsize(file_path) > self.config["max_file_size"]:
                    continue
                
                # Check if the file is in an excluded directory
                file_dir = os.path.dirname(file_path)
                if self.should_exclude_dir(file_dir):
                    print(f"  Skipping file in excluded directory: {rel_path}")
                    continue
                    
                results.append((file_path, rel_path))
                
        print(f"Collected {len(results)} files for processing")
        return results

    def extract_react_component(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Extract React component information from file content"""
        components = []
        
        # Match functional components
        func_component_pattern = r'(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]*)\s*(?:<.*?>)?\s*(?:=\s*(?:\([^)]*\)|[^=]*)\s*=>|[({])'
        func_matches = re.finditer(func_component_pattern, content)
        
        for match in func_matches:
            component_name = match.group(1)
            if component_name.endswith('Provider') or component_name.endswith('Context'):
                continue  # Skip context providers, process them separately
            
            start_pos = match.start()
            
            # Find JSX start position
            jsx_start = content.find('return (', start_pos)
            if jsx_start == -1:
                jsx_start = content.find('return {', start_pos)
            
            # Find component props
            props_match = re.search(r'\(\s*(?:{\s*([^}]*)\s*}|\s*props\s*|\s*([^)]*)\s*)', content[start_pos:start_pos+500])
            props = []
            
            if props_match:
                props_text = props_match.group(1) or props_match.group(2) or ''
                # Parse prop names
                prop_matches = re.finditer(r'(\w+)(?::\s*([^,\s]+))?', props_text)
                props = [{'name': m.group(1), 'type': m.group(2) if m.group(2) else 'any'} for m in prop_matches]
            
            # Extract hooks used
            hook_usages = []
            hook_matches = re.finditer(r'use[A-Z][a-zA-Z0-9]*', content[:jsx_start] if jsx_start != -1 else content)
            for hook_match in hook_matches:
                hook_usages.append(hook_match.group())
                self.hook_usages[component_name].add(hook_match.group())
            
            # Extract API calls
            api_calls = []
            api_patterns = [
                r'([a-zA-Z0-9_]+)\.(?:get|post|put|delete|patch)\(',
                r'fetch\(',
                r'axios\.(?:get|post|put|delete|patch)\(',
                r'api\.(?:[a-zA-Z0-9_]+)\('
            ]
            
            for pattern in api_patterns:
                api_matches = re.finditer(pattern, content)
                for api_match in api_matches:
                    api_calls.append(api_match.group())
                    self.api_calls[component_name].add(api_match.group())
            
            # Calculate complexity based on number of hooks, conditionals, etc.
            complexity = len(hook_usages) + len(api_calls)
            complexity += content.count('if (') + content.count('? ')
            
            component_data = {
                'name': component_name,
                'type': 'functional',
                'file_path': file_path,
                'props': props,
                'hooks_used': hook_usages,
                'api_calls': api_calls,
                'complexity': complexity
            }
            
            # Add performance analysis if enabled
            if self.config.get("analyze_performance", False):
                performance_issues = self.analyze_performance_issues(content, component_name)
                if performance_issues:
                    component_data['performance_issues'] = performance_issues
                    self.performance_issues.append({
                        'component': component_name,
                        'file_path': file_path,
                        'issues': performance_issues
                    })
            
            # Add React Native analysis if enabled
            if self.config.get("analyze_react_native", False):
                rn_issues = self.analyze_react_native_patterns(content, component_name)
                if rn_issues:
                    component_data['react_native_issues'] = rn_issues
                    self.react_native_issues.append({
                        'component': component_name,
                        'file_path': file_path,
                        'issues': rn_issues
                    })
            
            # Add state flow analysis if enabled
            if self.config.get("analyze_data_flow", False):
                state_flows = self.track_state_flow(content, component_name)
                if state_flows:
                    component_data['state_flows'] = state_flows
                    self.state_flows.update(state_flows)
            
            components.append(component_data)
            
            # Track complex components
            if complexity > 10:
                self.component_complexity.append({
                    'name': component_name,
                    'file_path': file_path,
                    'complexity': complexity
                })
            
            # Store props information for reference
            self.component_props[component_name] = props
        
        # Match class components
        class_component_pattern = r'class\s+([A-Z][a-zA-Z0-9_]*)\s+extends\s+(?:React\.)?Component'
        class_matches = re.finditer(class_component_pattern, content)
        
        for match in class_matches:
            component_name = match.group(1)
            start_pos = match.start()
            
            # Find render method
            render_start = content.find('render()', start_pos)
            if render_start == -1:
                render_start = content.find('render () {', start_pos)
            if render_start == -1:
                render_start = content.find('render() {', start_pos)
            
            # Extract API calls
            api_calls = []
            api_patterns = [
                r'([a-zA-Z0-9_]+)\.(?:get|post|put|delete|patch)\(',
                r'fetch\(',
                r'axios\.(?:get|post|put|delete|patch)\(',
                r'api\.(?:[a-zA-Z0-9_]+)\('
            ]
            
            for pattern in api_patterns:
                api_matches = re.finditer(pattern, content)
                for api_match in api_matches:
                    api_calls.append(api_match.group())
                    self.api_calls[component_name].add(api_match.group())
            
            # Calculate complexity
            complexity = len(api_calls)
            complexity += content.count('if (') + content.count('? ')
            complexity += content.count('this.state') + content.count('this.setState')
            
            component_data = {
                'name': component_name,
                'type': 'class',
                'file_path': file_path,
                'api_calls': api_calls,
                'complexity': complexity
            }
            
            # Add performance analysis if enabled
            if self.config.get("analyze_performance", False):
                performance_issues = self.analyze_performance_issues(content, component_name)
                if performance_issues:
                    component_data['performance_issues'] = performance_issues
                    self.performance_issues.append({
                        'component': component_name,
                        'file_path': file_path,
                        'issues': performance_issues
                    })
            
            # Add React Native analysis if enabled
            if self.config.get("analyze_react_native", False):
                rn_issues = self.analyze_react_native_patterns(content, component_name)
                if rn_issues:
                    component_data['react_native_issues'] = rn_issues
                    self.react_native_issues.append({
                        'component': component_name,
                        'file_path': file_path,
                        'issues': rn_issues
                    })
            
            components.append(component_data)
            
            # Track complex components
            if complexity > 10:
                self.component_complexity.append({
                    'name': component_name,
                    'file_path': file_path,
                    'complexity': complexity
                })
        
        return components

    def extract_hooks(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Extract custom hooks from file content"""
        hooks = []
        
        # Match custom hooks
        hook_pattern = r'(?:export\s+)?(?:const|function)\s+(use[A-Z][a-zA-Z0-9_]*)\s*(?:<.*?>)?\s*(?:=\s*(?:\([^)]*\)|[^=]*)\s*=>|[({])'
        hook_matches = re.finditer(hook_pattern, content)
        
        for match in hook_matches:
            hook_name = match.group(1)
            start_pos = match.start()
            
            # Find hook parameters
            params_match = re.search(r'\(\s*([^)]*)\s*\)', content[start_pos:start_pos+200])
            params = []
            
            if params_match:
                params_text = params_match.group(1)
                # Parse parameter names
                param_matches = re.finditer(r'(\w+)(?::\s*([^,\s]+))?', params_text)
                params = [{'name': m.group(1), 'type': m.group(2) if m.group(2) else 'any'} for m in param_matches]
            
            # Find return type (look for useState, useReducer patterns)
            return_values = []
            
            # Look for useState hooks
            state_hooks = re.finditer(r'const\s+\[\s*(\w+)\s*,\s*set(\w+)\s*\]\s*=\s*useState[<(]', content[start_pos:])
            for state_match in state_hooks:
                state_name = state_match.group(1)
                setter_name = 'set' + state_match.group(2)
                return_values.append(f"[{state_name}, {setter_name}]")
            
            # Look for other React hooks
            hook_usages = []
            hook_matches = re.finditer(r'(use[A-Z][a-zA-Z0-9]*)', content[start_pos:])
            for hook_match in hook_matches:
                if hook_match.group(1) != hook_name:  # Avoid self-reference
                    hook_usages.append(hook_match.group(1))
            
            # Extract API calls
            api_calls = []
            api_patterns = [
                r'([a-zA-Z0-9_]+)\.(?:get|post|put|delete|patch)\(',
                r'fetch\(',
                r'axios\.(?:get|post|put|delete|patch)\(',
                r'api\.(?:[a-zA-Z0-9_]+)\('
            ]
            
            for pattern in api_patterns:
                api_matches = re.finditer(pattern, content[start_pos:])
                for api_match in api_matches:
                    api_calls.append(api_match.group())
            
            hooks.append({
                'name': hook_name,
                'file_path': file_path,
                'params': params,
                'returns': return_values,
                'uses_hooks': hook_usages,
                'api_calls': api_calls
            })
            
            # Add to class hook list
            self.hooks.append({
                'name': hook_name,
                'file_path': file_path,
                'params': params,
                'returns': return_values,
                'uses_hooks': hook_usages,
                'api_calls': api_calls
            })
        
        return hooks

    def extract_services(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Extract service classes and methods from file content"""
        services = []
        
        # Check if it's a service file by filename pattern
        file_name = os.path.basename(file_path)
        is_service = "Service" in file_name or "/services/" in file_path
        
        if not is_service:
            return services
        
        # Match class definitions
        class_pattern = r'(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?'
        class_matches = re.finditer(class_pattern, content)
        
        for match in class_matches:
            service_name = match.group(1)
            parent_class = match.group(2) if match.group(2) else None
            start_pos = match.start()
            
            # Find methods
            methods = []
            method_pattern = r'(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*{'
            method_matches = re.finditer(method_pattern, content[start_pos:])
            
            for method_match in method_matches:
                method_name = method_match.group(1)
                if method_name in ['constructor', 'render']:
                    continue  # Skip standard methods
                
                params_str = method_match.group(2)
                return_type = method_match.group(3).strip() if method_match.group(3) else None
                
                # Parse params
                params = []
                if params_str:
                    param_matches = re.finditer(r'(\w+)(?::\s*([^,]+))?', params_str)
                    params = [{'name': m.group(1), 'type': m.group(2).strip() if m.group(2) else 'any'} for m in param_matches]
                
                methods.append({
                    'name': method_name,
                    'params': params,
                    'return_type': return_type
                })
            
            # Detect singleton pattern
            is_singleton = 'getInstance' in content and 'private constructor' in content
            
            # Extract API endpoints
            api_endpoints = []
            api_patterns = [
                r'(?:fetch|axios)\s*\(\s*[\'"`]([^\'"`]+)[\'"`]',
                r'(?:get|post|put|delete|patch)\s*\(\s*[\'"`]([^\'"`]+)[\'"`]'
            ]
            
            for pattern in api_patterns:
                endpoint_matches = re.finditer(pattern, content[start_pos:])
                for endpoint_match in endpoint_matches:
                    api_endpoints.append(endpoint_match.group(1))
            
            services.append({
                'name': service_name,
                'file_path': file_path,
                'parent_class': parent_class,
                'is_singleton': is_singleton,
                'methods': methods,
                'api_endpoints': api_endpoints
            })
            
            # Add to class services list
            self.services.append({
                'name': service_name,
                'file_path': file_path,
                'parent_class': parent_class,
                'is_singleton': is_singleton,
                'methods': methods,
                'api_endpoints': api_endpoints
            })
            
            # Add API endpoints to global list
            for endpoint in api_endpoints:
                self.api_endpoints.append({
                    'endpoint': endpoint,
                    'service': service_name,
                    'file_path': file_path
                })
        
        return services

    def extract_types(self, content: str, file_path: str) -> Dict[str, Any]:
        """Extract TypeScript interfaces and types"""
        types_info = {
            'interfaces': [],
            'types': [],
            'enums': []
        }
        
        # Extract interfaces
        interface_pattern = r'(?:export\s+)?interface\s+(\w+)(?:<[^>]*>)?\s*(?:extends\s+(\w+)(?:<[^>]*>)?)?\s*{'
        interface_matches = re.finditer(interface_pattern, content)
        
        for match in interface_matches:
            interface_name = match.group(1)
            parent_interface = match.group(2) if match.group(2) else None
            start_pos = match.start()
            
            # Find the end of the interface (closing brace)
            braces_count = 1
            end_pos = content.find('{', start_pos) + 1
            
            while braces_count > 0 and end_pos < len(content):
                if content[end_pos] == '{':
                    braces_count += 1
                elif content[end_pos] == '}':
                    braces_count -= 1
                end_pos += 1
            
            interface_content = content[start_pos:end_pos]
            
            # Extract properties
            properties = []
            property_pattern = r'(\w+)\??\s*:\s*([^;]+);'
            property_matches = re.finditer(property_pattern, interface_content)
            
            for prop_match in property_matches:
                prop_name = prop_match.group(1)
                prop_type = prop_match.group(2).strip()
                
                properties.append({
                    'name': prop_name,
                    'type': prop_type
                })
            
            types_info['interfaces'].append({
                'name': interface_name,
                'file_path': file_path,
                'parent': parent_interface,
                'properties': properties
            })
            
            # Add to global interfaces dict
            self.interfaces[interface_name] = {
                'file_path': file_path,
                'parent': parent_interface,
                'properties': properties
            }
        
        # Extract type aliases
        type_pattern = r'(?:export\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*([^;]+);'
        type_matches = re.finditer(type_pattern, content)
        
        for match in type_matches:
            type_name = match.group(1)
            type_definition = match.group(2).strip()
            
            types_info['types'].append({
                'name': type_name,
                'file_path': file_path,
                'definition': type_definition
            })
        
        # Extract enums
        enum_pattern = r'(?:export\s+)?enum\s+(\w+)\s*{'
        enum_matches = re.finditer(enum_pattern, content)
        
        for match in enum_matches:
            enum_name = match.group(1)
            start_pos = match.start()
            
            # Find the end of the enum (closing brace)
            braces_count = 1
            end_pos = content.find('{', start_pos) + 1
            
            while braces_count > 0 and end_pos < len(content):
                if content[end_pos] == '{':
                    braces_count += 1
                elif content[end_pos] == '}':
                    braces_count -= 1
                end_pos += 1
            
            enum_content = content[start_pos:end_pos]
            
            # Extract values
            values = []
            value_pattern = r'(\w+)(?:\s*=\s*([^,]+))?'
            value_matches = re.finditer(value_pattern, enum_content)
            
            for val_match in value_matches:
                val_name = val_match.group(1)
                if val_name in ['enum', 'export']:
                    continue  # Skip keywords
                
                val_value = val_match.group(2).strip() if val_match.group(2) else None
                
                values.append({
                    'name': val_name,
                    'value': val_value
                })
            
            types_info['enums'].append({
                'name': enum_name,
                'file_path': file_path,
                'values': values
            })
        
        return types_info

    def extract_navigation(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Extract navigation routes from file content"""
        routes = []
        
        # Check if it's a navigation file
        if not ("navigation" in file_path.lower() or "router" in file_path.lower()):
            return routes
        
        # Look for screen definitions
        screen_patterns = [
            r'<Stack\.Screen\s+name=[\'"]([^\'"]+)[\'"](?:\s+component={([^}]+)})?',
            r'<Tab\.Screen\s+name=[\'"]([^\'"]+)[\'"](?:\s+component={([^}]+)})?',
            r'<Drawer\.Screen\s+name=[\'"]([^\'"]+)[\'"](?:\s+component={([^}]+)})?',
            r'createStackNavigator\(\s*{\s*([^}]+)\s*}\s*\)',
            r'createBottomTabNavigator\(\s*{\s*([^}]+)\s*}\s*\)',
            r'createDrawerNavigator\(\s*{\s*([^}]+)\s*}\s*\)'
        ]
        
        for pattern in screen_patterns:
            matches = re.finditer(pattern, content)
            
            for match in matches:
                if match.group(1):
                    route_name = match.group(1)
                    component = match.group(2) if len(match.groups()) > 1 and match.group(2) else None
                    
                    routes.append({
                        'name': route_name,
                        'component': component,
                        'file_path': file_path
                    })
                else:
                    # For createXNavigator patterns, extract from the object
                    navigator_content = match.group(1)
                    route_matches = re.finditer(r'([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_]+)', navigator_content)
                    
                    for route_match in route_matches:
                        route_name = route_match.group(1)
                        component = route_match.group(2)
                        
                        routes.append({
                            'name': route_name,
                            'component': component,
                            'file_path': file_path
                        })
        
        # Add to class navigation routes
        self.navigation_routes.extend(routes)
        
        return routes

    def extract_state_management(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Extract state management patterns (Redux, Context API, etc.)"""
        state_patterns = []
        
        # Check for Redux
        redux_indicators = ['createStore', 'createSlice', 'useDispatch', 'useSelector', 'combineReducers', 'Provider']
        redux_count = sum(1 for indicator in redux_indicators if indicator in content)
        
        if redux_count >= 2:  # At least 2 indicators suggests Redux usage
            # Extract reducers
            reducer_pattern = r'(?:export\s+)?(?:const|function)\s+(\w+)Reducer\s*='
            reducer_matches = re.finditer(reducer_pattern, content)
            
            for match in reducer_matches:
                reducer_name = match.group(1)
                
                state_patterns.append({
                    'type': 'redux_reducer',
                    'name': f"{reducer_name}Reducer",
                    'file_path': file_path
                })
            
            # Extract slices (Redux Toolkit)
            slice_pattern = r'(?:export\s+)?const\s+(\w+)Slice\s*=\s*createSlice\('
            slice_matches = re.finditer(slice_pattern, content)
            
            for match in slice_matches:
                slice_name = match.group(1)
                
                state_patterns.append({
                    'type': 'redux_slice',
                    'name': f"{slice_name}Slice",
                    'file_path': file_path
                })
            
            # Extract actions
            action_pattern = r'(?:export\s+)?const\s+{\s*([^}]+)\s*}\s*=\s*(\w+)Slice\.actions'
            action_matches = re.finditer(action_pattern, content)
            
            for match in action_matches:
                actions = [a.strip() for a in match.group(1).split(',')]
                slice_name = match.group(2)
                
                for action in actions:
                    state_patterns.append({
                        'type': 'redux_action',
                        'name': action,
                        'slice': slice_name,
                        'file_path': file_path
                    })
        
        # Check for Context API
        if 'createContext' in content:
            # Extract contexts
            context_pattern = r'(?:export\s+)?const\s+(\w+)Context\s*=\s*(?:React\.)?createContext\('
            context_matches = re.finditer(context_pattern, content)
            
            for match in context_matches:
                context_name = match.group(1)
                
                state_patterns.append({
                    'type': 'context',
                    'name': f"{context_name}Context",
                    'file_path': file_path
                })
            
            # Extract providers
            provider_pattern = r'(?:export\s+)?(?:const|function)\s+(\w+)Provider\s*=\s*\(\s*{\s*children\s*}'
            provider_matches = re.finditer(provider_pattern, content)
            
            for match in provider_matches:
                provider_name = match.group(1)
                
                state_patterns.append({
                    'type': 'context_provider',
                    'name': f"{provider_name}Provider",
                    'file_path': file_path
                })
        
        # Add to class state management list
        self.state_management.extend(state_patterns)
        
        return state_patterns

    def build_component_hierarchy(self):
        """Build a tree of component relationships based on JSX usage"""
        hierarchy = {}
        
        for file_path, rel_path in self.files:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                
            # Extract component imports
            import_matches = re.finditer(r'import\s+{([^}]+)}\s+from', content)
            imported_components = []
            for match in import_matches:
                components = [c.strip() for c in match.group(1).split(',')]
                imported_components.extend(components)
            
            # Find component usages in JSX
            for component in imported_components:
                # Look for <ComponentName patterns
                usage_pattern = r'<\s*' + re.escape(component) + r'\s*[^>]*>'
                if re.search(usage_pattern, content):
                    # Find the parent component
                    for extracted_component in self.extract_react_component(content, file_path):
                        if extracted_component:
                            parent_name = extracted_component['name']
                            if parent_name not in hierarchy:
                                hierarchy[parent_name] = []
                            if component not in hierarchy[parent_name]:
                                hierarchy[parent_name].append(component)
        
        return hierarchy

    def track_state_flow(self, content, component_name):
        """Track state passing between components via props"""
        state_flows = {}
        
        # Find useState declarations
        state_matches = re.finditer(r'const\s+\[\s*(\w+)\s*,\s*set(\w+)\s*\]\s*=\s*useState', content)
        for match in state_matches:
            state_name = match.group(1)
            
            # Find where this state is passed as props
            prop_pattern = r'<(\w+)[^>]*\b' + re.escape(state_name) + r'={[^}]*}'
            prop_matches = re.finditer(prop_pattern, content)
            
            for prop_match in prop_matches:
                child_component = prop_match.group(1)
                if component_name not in state_flows:
                    state_flows[component_name] = {}
                
                if child_component not in state_flows[component_name]:
                    state_flows[component_name][child_component] = []
                    
                state_flows[component_name][child_component].append(state_name)
        
        return state_flows
        
    def analyze_performance_issues(self, content, component_name):
        """Identify potential performance issues in React components"""
        issues = []
        
        # Check for missing dependency arrays in useEffect
        effect_missing_deps = re.findall(r'useEffect\(\s*\(\)\s*=>\s*{[^}]+}\s*\)', content)
        if effect_missing_deps:
            issues.append(f"Component '{component_name}' has useEffect without dependency array")
        
        # Check for inline function definitions in JSX
        inline_functions = re.findall(r'<\w+\s+\w+={(?:\(\)\s*=>|function\s*\([^)]*\)\s*{)[^}]+}', content)
        if inline_functions:
            issues.append(f"Component '{component_name}' has {len(inline_functions)} inline functions in JSX")
        
        # Check for missing memo or React.memo usage in exported components
        if not re.search(r'memo\(\s*' + re.escape(component_name), content) and not re.search(r'React\.memo\(\s*' + re.escape(component_name), content):
            # Only flag for components with props that might need memoization
            if re.search(r'const\s+' + re.escape(component_name) + r'\s*=\s*\(\s*{\s*[^}]+}\s*\)', content):
                issues.append(f"Component '{component_name}' could benefit from memoization")
        
        return issues

    def analyze_react_native_patterns(self, content, component_name):
        """Analyze React Native specific patterns and potential issues"""
        issues = []
        
        # Check for inline styles (better to use StyleSheet)
        inline_styles = re.findall(r'style={{\s*[^}]+}}', content)
        if inline_styles:
            issues.append(f"Component '{component_name}' has {len(inline_styles)} inline styles that should use StyleSheet")
        
        # Check for missing platform-specific code
        if 'Platform.OS' not in content and ('SafeAreaView' in content or 'StatusBar' in content):
            issues.append(f"Component '{component_name}' might need platform-specific handling")
        
        # Check for large image resources without resize mode
        if 'Image' in content and 'source' in content and 'resizeMode' not in content:
            issues.append(f"Component '{component_name}' has Image without resizeMode specified")
        
        # Check for potential memory leaks in navigation events
        if ('useEffect' in content and 'navigation' in content and 
            ('addEventListener' in content or 'addListener' in content) and 
            'return' not in content):
            issues.append(f"Component '{component_name}' might have memory leaks from navigation event listeners")
        
        return issues

    def extract_database_schema(self, content: str, file_path: str) -> Dict[str, Any]:
        """Extract database schema information from file content"""
        schemas = []
        
        # Extract constant definitions for database names
        db_name_pattern = r'(?:const|let|var|export\s+const)\s+(\w+)_DATABASE_NAME\s*=\s*[\'"]([^\'"]+)[\'"]'
        db_names = {}
        for match in re.finditer(db_name_pattern, content):
            prefix = match.group(1)
            value = match.group(2)
            db_names[prefix] = value
            db_names[f"{prefix}_DATABASE_NAME"] = value  # Store both forms
        
        # Look for CREATE TABLE statements with both literal and template variable names
        # This pattern now handles both "TableName" and "${VARIABLE_NAME}"
        table_pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:([`"\w]+)|[$]{([^}]+)})\s*\(([^;]+)\)'
        table_matches = re.finditer(table_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for match in table_matches:
            # Either direct table name or variable reference
            table_name = match.group(1) if match.group(1) else match.group(2)
            columns_def = match.group(3).strip()
            
            # If it's a variable reference, try to resolve it from known DB names
            if not match.group(1) and table_name in db_names:
                table_name = db_names[table_name]
            elif not match.group(1):
                # For template literals we couldn't resolve, use the variable name as table name
                table_name = f"{table_name} (variable)"
            else:
                # For direct table names, clean up quotes
                table_name = table_name.strip('`"')
            
            # Parse columns
            columns = []
            primary_keys = []
            foreign_keys = []
            
            # Split by commas, but handle complex constraints that may contain commas
            column_lines = []
            current_line = ""
            paren_count = 0
            
            for char in columns_def:
                current_line += char
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                elif char == ',' and paren_count == 0:
                    column_lines.append(current_line.strip().rstrip(','))
                    current_line = ""
            
            if current_line.strip():
                column_lines.append(current_line.strip())
            
            # Process column definitions
            for line in column_lines:
                # Check if this is a column definition or constraint
                if re.match(r'^\s*(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)', line, re.IGNORECASE):
                    # Handle constraints
                    if re.search(r'PRIMARY\s+KEY', line, re.IGNORECASE):
                        pk_match = re.search(r'PRIMARY\s+KEY\s*\(([^)]+)\)', line, re.IGNORECASE)
                        if pk_match:
                            pks = [pk.strip('`"') for pk in pk_match.group(1).split(',')]
                            primary_keys.extend(pks)
                    
                    if re.search(r'FOREIGN\s+KEY', line, re.IGNORECASE):
                        fk_match = re.search(r'FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s*([`"\w]+|\${[^}]+})\s*\(([^)]+)\)', line, re.IGNORECASE)
                        if fk_match:
                            fk_cols = [col.strip('`"') for col in fk_match.group(1).split(',')]
                            ref_table = fk_match.group(2).strip('`"')
                            
                            # Handle variable reference in foreign key
                            if ref_table.startswith('${') and ref_table.endswith('}'):
                                var_name = ref_table[2:-1]
                                if var_name in db_names:
                                    ref_table = db_names[var_name]
                                else:
                                    ref_table = f"{var_name} (variable)"
                                    
                            ref_cols = [col.strip('`"') for col in fk_match.group(3).split(',')]
                            
                            for i, fk_col in enumerate(fk_cols):
                                ref_col = ref_cols[i] if i < len(ref_cols) else ref_cols[-1]
                                foreign_keys.append({
                                    'column': fk_col,
                                    'ref_table': ref_table,
                                    'ref_column': ref_col
                                })
                else:
                    # Regular column definition
                    parts = line.split()
                    if len(parts) >= 2:
                        col_name = parts[0].strip('`"')
                        col_type = parts[1].split('(')[0]  # Extract base type without size
                        
                        column = {
                            'name': col_name,
                            'type': col_type
                        }
                        
                        # Check for constraints in column definition
                        if 'NOT NULL' in line.upper():
                            column['nullable'] = False
                        else:
                            column['nullable'] = True
                        
                        if 'PRIMARY KEY' in line.upper():
                            primary_keys.append(col_name)
                        
                        if 'DEFAULT' in line.upper():
                            default_match = re.search(r'DEFAULT\s+([^,\s]+)', line, re.IGNORECASE)
                            if default_match:
                                column['default'] = default_match.group(1)
                        
                        columns.append(column)
            
            # Look for INDEX statements related to this table
            # This pattern now handles both "TableName" and "${VARIABLE_NAME}"
            index_pattern = r'CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(?:([`"\w]+)|[$]{([^}]+)})\s*\(([^)]+)\)'
            index_matches = re.finditer(index_pattern, content, re.IGNORECASE)
            
            indices = []
            for idx_match in index_matches:
                idx_table = idx_match.group(2) if idx_match.group(2) else idx_match.group(3)
                
                # If it's a variable, try to resolve it
                if not idx_match.group(2) and idx_table in db_names:
                    idx_table = db_names[idx_table]
                
                # Check if this index belongs to our table (either by name or by variable)
                if idx_table == table_name or (table_name.endswith(' (variable)') and idx_table == table_name[:-11]):
                    idx_name = idx_match.group(1)
                    idx_columns = [col.strip('`"') for col in idx_match.group(4).split(',')]
                    unique = 'UNIQUE' in idx_match.group(0).upper()
                    
                    indices.append({
                        'name': idx_name,
                        'columns': idx_columns,
                        'unique': unique
                    })
            
            # Extract additional table info from constants file if available
            schema_description = None
            schema_source = file_path
            
            schemas.append({
                'table_name': table_name,
                'columns': columns,
                'primary_keys': primary_keys,
                'foreign_keys': foreign_keys,
                'indices': indices,
                'description': schema_description,
                'file_path': schema_source
            })
        
        return {'schemas': schemas}

    def extract_import_dependencies(self, content: str, file_path: str) -> Dict[str, Any]:
        """Extract import statements and build dependency relationships"""
        dependencies = []
        
        # Match import statements
        import_patterns = [
            r'import\s+{([^}]+)}\s+from\s+[\'"]([^\'"]+)[\'"]',  # import { X } from 'Y'
            r'import\s+(\w+)\s+from\s+[\'"]([^\'"]+)[\'"]',      # import X from 'Y'
            r'import\s+[\'"]([^\'"]+)[\'"]'                     # import 'X'
        ]
        
        for pattern in import_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                if len(match.groups()) == 2:
                    # Named imports or default import
                    if '{' in match.group(0):
                        # Named imports
                        imported_items = [item.strip() for item in match.group(1).split(',')]
                        source = match.group(2)
                        
                        for item in imported_items:
                            dependencies.append({
                                'type': 'named',
                                'name': item,
                                'source': source
                            })
                    else:
                        # Default import
                        name = match.group(1)
                        source = match.group(2)
                        
                        dependencies.append({
                            'type': 'default',
                            'name': name,
                            'source': source
                        })
                elif len(match.groups()) == 1:
                    # Side effect import
                    source = match.group(1)
                    
                    dependencies.append({
                        'type': 'side_effect',
                        'source': source
                    })
        
        return {'dependencies': dependencies}

    def extract_complex_types(self, content: str, file_path: str) -> Dict[str, Any]:
        """Extract and analyze complex TypeScript types with relationships"""
        type_system = {
            'interfaces': [],
            'types': [],
            'enums': [],
            'type_relationships': []
        }
        
        # Extract interfaces with inheritance
        interface_pattern = r'(?:export\s+)?interface\s+(\w+)(?:<[^>]*>)?\s*(?:extends\s+([^{]+))?\s*{([^}]*)}'
        interface_matches = re.finditer(interface_pattern, content, re.DOTALL)
        
        for match in interface_matches:
            interface_name = match.group(1)
            extends = match.group(2).strip() if match.group(2) else None
            body = match.group(3).strip()
            
            # Extract properties with types
            properties = []
            property_pattern = r'(\w+)(?:\?)?:\s*([^;]+);'
            property_matches = re.finditer(property_pattern, body)
            
            for prop_match in property_matches:
                prop_name = prop_match.group(1)
                prop_type = prop_match.group(2).strip()
                
                properties.append({
                    'name': prop_name,
                    'type': prop_type
                })
            
            interface_info = {
                'name': interface_name,
                'extends': extends,
                'properties': properties,
                'file_path': file_path
            }
            
            type_system['interfaces'].append(interface_info)
            
            # Track inheritance relationships
            if extends:
                parent_interfaces = [p.strip() for p in extends.split(',')]
                for parent in parent_interfaces:
                    type_system['type_relationships'].append({
                        'from': interface_name,
                        'to': parent,
                        'type': 'extends'
                    })
        
        # Extract complex type aliases
        type_pattern = r'(?:export\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*([^;]+);'
        type_matches = re.finditer(type_pattern, content)
        
        for match in type_matches:
            type_name = match.group(1)
            type_definition = match.group(2).strip()
            
            # Analyze union, intersection, mapped types
            type_info = {
                'name': type_name,
                'definition': type_definition,
                'file_path': file_path,
                'category': self.categorize_type(type_definition)
            }
            
            type_system['types'].append(type_info)
            
            # Track type dependencies
            for other_type in self.extract_type_references(type_definition):
                type_system['type_relationships'].append({
                    'from': type_name,
                    'to': other_type,
                    'type': 'references'
                })
        
        return type_system

    def categorize_type(self, type_definition: str) -> str:
        """Categorize the kind of type definition"""
        if '|' in type_definition:
            return 'union'
        elif '&' in type_definition:
            return 'intersection'
        elif type_definition.startswith('Record<') or type_definition.startswith('Partial<'):
            return 'utility'
        elif type_definition.startswith('{') and '=>' in type_definition:
            return 'function'
        elif type_definition.startswith('[') and ']' in type_definition:
            return 'tuple'
        elif '{' in type_definition and '}' in type_definition:
            return 'object'
        else:
            return 'basic'

    def extract_type_references(self, type_definition: str) -> List[str]:
        """Extract referenced types from a type definition"""
        # Basic regex to find type names
        referenced_types = []
        type_refs = re.finditer(r'(?<![\'"`])(\b[A-Z]\w+)\b(?![\'"`])', type_definition)
        
        for match in type_refs:
            referenced_types.append(match.group(1))
        
        return referenced_types

    def extract_api_endpoints(self, content: str, file_path: str) -> Dict[str, Any]:
        """Extract API endpoints from service files"""
        endpoints = []
        
        # Match various API call patterns
        patterns = [
            # Fetch pattern
            r'fetch\([\'"]([^\'"]+)[\'"](?:,\s*({[^}]+}))?\)',
            
            # Axios pattern
            r'axios\.(?:get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"](?:,\s*([^,)]+))?\)',
            
            # Custom API client pattern
            r'api\.(?:get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"](?:,\s*([^,)]+))?\)',
            
            # REST method pattern
            r'(?:get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"](?:,\s*([^,)]+))?\)'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                endpoint = match.group(1)
                
                # Try to extract request body/params if available
                request_data = None
                if len(match.groups()) > 1 and match.group(2):
                    request_data = match.group(2)
                
                # Determine HTTP method
                method = 'GET'  # Default
                if 'post(' in match.group(0).lower():
                    method = 'POST'
                elif 'put(' in match.group(0).lower():
                    method = 'PUT'
                elif 'delete(' in match.group(0).lower():
                    method = 'DELETE'
                elif 'patch(' in match.group(0).lower():
                    method = 'PATCH'
                
                # Try to extract surrounding function name
                function_name = self.extract_containing_function(content, match.start())
                
                # Extract return type if available
                return_type = self.extract_return_type(content, match.start())
                
                endpoints.append({
                    'endpoint': endpoint,
                    'method': method,
                    'request_data': request_data,
                    'function': function_name,
                    'return_type': return_type,
                    'file_path': file_path
                })
        
        return {'api_endpoints': endpoints}
    
    def extract_containing_function(self, content: str, position: int) -> Optional[str]:
        """Extract the name of the function containing the given position"""
        # Find the nearest function declaration before the position
        function_pattern = r'(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)'
        matches = list(re.finditer(function_pattern, content[:position]))
        
        if matches:
            last_match = matches[-1]
            return last_match.group(1) or last_match.group(2)
        
        return None
    
    def extract_return_type(self, content: str, position: int) -> Optional[str]:
        """Extract return type of the function containing the given position"""
        function_with_return = r'(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\))\s*:\s*([^{]+)'
        matches = list(re.finditer(function_with_return, content[:position]))
        
        if matches:
            last_match = matches[-1]
            return last_match.group(1).strip()
        
        return None

    def analyze_prop_flow(self, file_path: str, component_name: str, props: List[Dict]) -> Dict[str, Any]:
        """Analyze how props flow through a component"""
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        prop_usage = {}
        
        for prop in props:
            prop_name = prop['name']
            
            # Find where this prop is used within the component
            usages = []
            
            # Direct usage pattern (props.X or X from destructured props)
            direct_pattern = r'(?:props\.{0}|{0})\b'.format(prop_name)
            direct_matches = re.finditer(direct_pattern, content)
            for match in direct_matches:
                context = self.get_context_snippet(content, match.start(), 60)
                usages.append({
                    'type': 'direct',
                    'context': context
                })
            
            # Passed to child component pattern (<ChildComponent propName={X})
            passed_pattern = r'<(\w+)[^>]*{0}={[^}]+}'.format(prop_name)
            passed_matches = re.finditer(passed_pattern, content)
            for match in passed_matches:
                child_component = match.group(1)
                context = self.get_context_snippet(content, match.start(), 60)
                usages.append({
                    'type': 'passed_to_child',
                    'child_component': child_component,
                    'context': context
                })
            
            # Used in conditional rendering
            conditional_pattern = r'{\s*(?:props\.)?{0}\s*\?.+?:'.format(prop_name)
            conditional_matches = re.finditer(conditional_pattern, content)
            for match in conditional_matches:
                context = self.get_context_snippet(content, match.start(), 60)
                usages.append({
                    'type': 'conditional_rendering',
                    'context': context
                })
            
            prop_usage[prop_name] = usages
        
        return {
            'component': component_name,
            'file_path': file_path,
            'prop_usage': prop_usage
        }
    
    def get_context_snippet(self, content: str, position: int, context_length: int) -> str:
        """Get a snippet of content around the specified position"""
        start = max(0, position - context_length // 2)
        end = min(len(content), position + context_length // 2)
        return content[start:end].replace('\n', ' ').strip()

    def extract_style_patterns(self, content: str, file_path: str) -> Dict[str, Any]:
        """Extract and analyze styling patterns"""
        style_info = {
            'style_definitions': [],
            'inline_styles': [],
            'theme_usages': [],
            'style_patterns': []
        }
        
        # Extract StyleSheet.create definitions
        stylesheet_pattern = r'(?:const|let|var)\s+(\w+)\s*=\s*StyleSheet\.create\(\s*({[^}]+})\s*\)'
        stylesheet_matches = re.finditer(stylesheet_pattern, content, re.DOTALL)
        
        for match in stylesheet_matches:
            style_name = match.group(1)
            style_content = match.group(2)
            
            style_info['style_definitions'].append({
                'name': style_name,
                'content': style_content,
                'file_path': file_path
            })
            
            # Parse individual style rules
            style_rule_pattern = r'(\w+):\s*{([^}]+)}'
            style_rule_matches = re.finditer(style_rule_pattern, style_content)
            
            for rule_match in style_rule_matches:
                rule_name = rule_match.group(1)
                rule_content = rule_match.group(2)
                
                style_info['style_patterns'].append({
                    'stylesheet': style_name,
                    'rule_name': rule_name,
                    'rule_content': rule_content
                })
        
        # Extract inline styles
        inline_style_pattern = r'style={({[^}]+})}'
        inline_style_matches = re.finditer(inline_style_pattern, content)
        
        for match in inline_style_matches:
            style_content = match.group(1)
            context = self.get_context_snippet(content, match.start(), 100)
            
            style_info['inline_styles'].append({
                'content': style_content,
                'context': context,
                'file_path': file_path
            })
        
        # Extract theme usages (COLORS, etc.)
        theme_usage_pattern = r'(COLORS\.\w+(?:\.\w+)?)'
        theme_usage_matches = re.finditer(theme_usage_pattern, content)
        
        for match in theme_usage_matches:
            theme_var = match.group(1)
            context = self.get_context_snippet(content, match.start(), 60)
            
            style_info['theme_usages'].append({
                'variable': theme_var,
                'context': context,
                'file_path': file_path
            })
        
        return style_info

    def analyze_hook_usage(self, content: str, file_path: str) -> Dict[str, Any]:
        """Analyze custom hook implementations and usage patterns"""
        hook_analysis = {
            'hook_definitions': [],
            'hook_usages': [],
            'dependencies': [],
            'state_management': []
        }
        
        # Extract hook definitions
        hook_pattern = r'(?:export\s+)?(?:function|const)\s+(use\w+)'
        hook_matches = re.finditer(hook_pattern, content)
        
        for match in hook_matches:
            hook_name = match.group(1)
            hook_start = match.start()
            
            # Find the function end (this is a simplification)
            hook_body = self.extract_function_body(content, hook_start)
            
            # Analyze useState calls
            state_pattern = r'const\s+\[\s*(\w+)\s*,\s*set(\w+)\s*\]\s*=\s*useState(?:<[^>]*>)?\(([^)]*)\)'
            state_matches = re.finditer(state_pattern, hook_body)
            
            states = []
            for state_match in state_matches:
                state_name = state_match.group(1)
                setter_name = 'set' + state_match.group(2)
                initial_value = state_match.group(3).strip()
                
                states.append({
                    'name': state_name,
                    'setter': setter_name,
                    'initial_value': initial_value
                })
            
            # Analyze useEffect calls
            effect_pattern = r'useEffect\(\(\)\s*=>\s*{([^}]+)}\s*,\s*\[([^]]*)\]\)'
            effect_matches = re.finditer(effect_pattern, hook_body)
            
            effects = []
            for effect_match in effect_matches:
                effect_body = effect_match.group(1).strip()
                dependencies = effect_match.group(2).strip()
                
                dep_list = []
                if dependencies:
                    dep_list = [dep.strip() for dep in dependencies.split(',')]
                
                effects.append({
                    'body': effect_body,
                    'dependencies': dep_list
                })
            
            # Analyze useCallback/useMemo calls
            memo_pattern = r'(?:useCallback|useMemo)\((?:\([^)]*\))?\s*=>\s*{([^}]+)}\s*,\s*\[([^]]*)\]\)'
            memo_matches = re.finditer(memo_pattern, hook_body)
            
            memoized = []
            for memo_match in memo_matches:
                memo_body = memo_match.group(1).strip()
                dependencies = memo_match.group(2).strip()
                
                dep_list = []
                if dependencies:
                    dep_list = [dep.strip() for dep in dependencies.split(',')]
                
                is_callback = 'useCallback' in memo_match.group(0)
                
                memoized.append({
                    'type': 'callback' if is_callback else 'memo',
                    'body': memo_body,
                    'dependencies': dep_list
                })
            
            hook_analysis['hook_definitions'].append({
                'name': hook_name,
                'file_path': file_path,
                'states': states,
                'effects': effects,
                'memoized': memoized
            })
        
        # Find hook usages in non-hook functions
        component_pattern = r'(?:export\s+)?(?:function|const)\s+([A-Z]\w+)'
        component_matches = re.finditer(component_pattern, content)
        
        for match in component_matches:
            component_name = match.group(1)
            component_start = match.start()
            
            component_body = self.extract_function_body(content, component_start)
            
            # Find hook calls within this component
            hook_call_pattern = r'(?:const\s+(?:\w+|\[[^\]]+\])\s*=\s*)?(use\w+)\('
            hook_call_matches = re.finditer(hook_call_pattern, component_body)
            
            component_hooks = []
            for hook_call in hook_call_matches:
                hook_name = hook_call.group(1)
                context = self.get_context_snippet(component_body, hook_call.start(), 80)
                
                component_hooks.append({
                    'hook': hook_name,
                    'context': context
                })
            
            if component_hooks:
                hook_analysis['hook_usages'].append({
                    'component': component_name,
                    'file_path': file_path,
                    'hooks': component_hooks
                })
        
        return hook_analysis
    
    def extract_function_body(self, content: str, start_pos: int) -> str:
        """Extract the function body from a given starting position"""
        # Find opening brace
        brace_pos = content.find('{', start_pos)
        if brace_pos == -1:
            return ""
        
        # Track nested braces to find the matching closing brace
        brace_count = 1
        pos = brace_pos + 1
        
        while pos < len(content) and brace_count > 0:
            if content[pos] == '{':
                brace_count += 1
            elif content[pos] == '}':
                brace_count -= 1
            pos += 1
        
        if brace_count == 0:
            return content[brace_pos:pos]
        
        return content[brace_pos:]

    def extract_navigation_routes(self, content: str, file_path: str) -> Dict[str, Any]:
        """Extract and analyze navigation routes and screen transitions"""
        navigation_info = {
            'routes': [],
            'screens': [],
            'transitions': [],
            'params': []
        }
        
        # Extract Expo Router route definitions
        router_pattern = r'<(Stack|Tabs|Drawer)\.Screen\s+name=[\'"]([^\'"]+)[\'"]'
        router_matches = re.finditer(router_pattern, content)
        
        for match in router_matches:
            nav_type = match.group(1)
            route_name = match.group(2)
            
            # Try to extract options
            options_start = content.find('options=', match.start())
            options_content = ""
            if options_start > 0 and options_start < match.start() + 200:  # Within reasonable range
                options_end = content.find('/>', options_start)
                if options_end > 0:
                    options_content = content[options_start:options_end]
            
            navigation_info['routes'].append({
                'type': nav_type,
                'name': route_name,
                'options': options_content,
                'file_path': file_path
            })
        
        # Extract useRouter().push calls
        push_pattern = r'(?:router|navigation)\.(?:push|navigate)\(\s*[\'"]([^\'"]+)[\'"](?:\s*,\s*({[^}]+}))?\s*\)'
        push_matches = re.finditer(push_pattern, content)
        
        for match in push_matches:
            route = match.group(1)
            params = match.group(2) if len(match.groups()) > 1 and match.group(2) else None
            
            navigation_info['transitions'].append({
                'to': route,
                'params': params,
                'context': self.get_context_snippet(content, match.start(), 120),
                'file_path': file_path
            })
        
        # Extract Expo Router route params
        param_pattern = r'useLocalSearchParams\(\)'
        param_matches = re.finditer(param_pattern, content)
        
        for match in param_matches:
            # Look for destrucutred params
            destruct_pattern = r'const\s+{([^}]+)}\s*=\s*useLocalSearchParams\(\)'
            destruct_match = re.search(destruct_pattern, content[max(0, match.start()-50):match.start()+50])
            
            if destruct_match:
                params = [param.strip() for param in destruct_match.group(1).split(',')]
                
                navigation_info['params'].append({
                    'params': params,
                    'file_path': file_path
                })
        
        return navigation_info

    def analyze_security_patterns(self, content: str, file_path: str) -> Dict[str, Any]:
        """Analyze security practices and patterns in the code"""
        security_info = {
            'data_validation': [],
            'authentication_checks': [],
            'sensitive_data': [],
            'security_concerns': []
        }
        
        # Look for input validation
        validation_patterns = [
            r'\.validate\(',
            r'\.isValid\(',
            r'validator\.',
            r'new\s+Validator\(',
            r'schema\.validate\('
        ]
        
        for pattern in validation_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                context = self.get_context_snippet(content, match.start(), 100)
                security_info['data_validation'].append({
                    'pattern': pattern,
                    'context': context,
                    'file_path': file_path
                })
        
        # Look for authentication checks
        auth_patterns = [
            r'isAuthenticated\(',
            r'requireAuth',
            r'checkAuth',
            r'AuthContext',
            r'useAuth\(',
            r'isLoggedIn'
        ]
        
        for pattern in auth_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                context = self.get_context_snippet(content, match.start(), 100)
                security_info['authentication_checks'].append({
                    'pattern': pattern,
                    'context': context,
                    'file_path': file_path
                })
        
        # Look for potential sensitive data
        sensitive_patterns = [
            r'password',
            r'token',
            r'secret',
            r'auth',
            r'key',
            r'credentials'
        ]
        
        for pattern in sensitive_patterns:
            matches = re.finditer(r'\b' + pattern + r'\b', content, re.IGNORECASE)
            for match in matches:
                context = self.get_context_snippet(content, match.start(), 100)
                
                # Filter out false positives (in comments, etc.)
                if not (
                    '// ' in context[:context.find(match.group(0))] or
                    '/* ' in context[:context.find(match.group(0))]
                ):
                    security_info['sensitive_data'].append({
                        'term': match.group(0),
                        'context': context,
                        'file_path': file_path
                    })
        
        # Identify security concerns
        concern_patterns = {
            'Hardcoded secrets': r'(?:apiKey|secretKey|password|token)\s*=\s*[\'"][^\'"]+[\'"]',
            'Insecure storage': r'localStorage\.setItem\([\'"](?:token|auth|password)[\'"]',
            'SQL injection risk': r'executeQuery\([\'"]SELECT.+\$\{',
            'XSS risk': r'(?:innerHTML|dangerouslySetInnerHTML)\s*=',
            'Potential CSRF': r'fetch\(.+{credentials:\s*[\'"]include[\'"]'
        }
        
        for concern, pattern in concern_patterns.items():
            matches = re.finditer(pattern, content)
            for match in matches:
                context = self.get_context_snippet(content, match.start(), 100)
                security_info['security_concerns'].append({
                    'issue': concern,
                    'pattern': pattern,
                    'context': context,
                    'file_path': file_path
                })
        
        return security_info

    def track_api_data_flow(self):
        """Track data flow from API calls to component state"""
        api_flows = {}
        
        for file_path, rel_path in self.files:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            # Find API calls that update state
            api_call_pattern = r'(get|post|put|delete|patch|fetch)\([^)]+\)(?:.*?)\.then\(\s*(?:\([^)]*\)\s*=>\s*{\s*(?:set(\w+)|this\.setState\(\s*{\s*(\w+)))'
            api_matches = re.finditer(api_call_pattern, content, re.DOTALL)
            
            for match in api_matches:
                api_method = match.group(1)
                state_updated = match.group(2) or match.group(3)
                
                # Find the component for this file
                for component in self.extract_react_component(content, file_path):
                    if component:
                        component_name = component['name']
                        if component_name not in api_flows:
                            api_flows[component_name] = []
                        
                        api_flows[component_name].append({
                            'api_method': api_method,
                            'state_updated': state_updated
                        })
        
        return api_flows
        
    def analyze_hook_patterns(self):
        """Analyze patterns and potential optimizations in hook usage"""
        hook_patterns = {}
        
        # For each custom hook
        for hook in self.hooks:
            hook_name = hook['name']
            hook_patterns[hook_name] = {
                'usage_count': 0,
                'components': [],
                'potential_optimizations': []
            }
            
            # Find components using this hook
            for component_name, used_hooks in self.hook_usages.items():
                if hook_name in used_hooks:
                    hook_patterns[hook_name]['usage_count'] += 1
                    hook_patterns[hook_name]['components'].append(component_name)
            
            # Check for potential optimizations
            if hook['api_calls'] and not any('useCallback' in h for h in hook['uses_hooks']):
                hook_patterns[hook_name]['potential_optimizations'].append(
                    f"API calls in '{hook_name}' could benefit from useCallback"
                )
                
            if hook['api_calls'] and not any('useMemo' in h for h in hook['uses_hooks']):
                hook_patterns[hook_name]['potential_optimizations'].append(
                    f"Data processing in '{hook_name}' could benefit from useMemo"
                )
        
        return hook_patterns

    def generate_output(self, format='text'):
        """Generate output in different formats (text, json, markdown, html)"""
        if format == 'text':
            return self.generate_text_output()
        elif format == 'json':
            return self.generate_json_output()
        elif format == 'markdown':
            return self.generate_markdown_output()
        elif format == 'html':
            return self.generate_html_output()
        else:
            raise ValueError(f"Unsupported output format: {format}")

    def generate_json_output(self):
        """Generate JSON output"""
        data = {
            'components': self.component_complexity,
            'hooks': self.hooks,
            'services': self.services,
            'api_endpoints': self.api_endpoints,
            'interfaces': self.interfaces,
            'navigation_routes': self.navigation_routes,
            'component_hierarchy': self.build_component_hierarchy()
        }
        return json.dumps(data, indent=2)

    def generate_markdown_output(self):
        """Generate Markdown output"""
        lines = []
        
        # Header
        lines.append("# React Native/TypeScript Codebase Analysis")
        lines.append(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        
        # Component Hierarchy Section
        lines.append("## Component Hierarchy")
        hierarchy = self.build_component_hierarchy()
        for parent, children in hierarchy.items():
            lines.append(f"### {parent}")
            for child in children:
                lines.append(f"- {child}")
            lines.append("")
        
        # Complex Components Section
        lines.append("## Complex Components")
        sorted_components = sorted(self.component_complexity, key=lambda x: x['complexity'], reverse=True)
        lines.append("| Component | Complexity | File |")
        lines.append("|-----------|------------|------|")
        for component in sorted_components[:20]:
            lines.append(f"| {component['name']} | {component['complexity']} | {os.path.basename(component['file_path'])} |")
        
        # Hooks Section
        lines.append("\n## Custom Hooks")
        for hook in self.hooks:
            lines.append(f"### {hook['name']}")
            if hook['params']:
                lines.append("**Parameters:**")
                for param in hook['params']:
                    lines.append(f"- {param['name']}: {param.get('type', 'any')}")
            if hook['uses_hooks']:
                lines.append("**Uses hooks:**")
                for used_hook in hook['uses_hooks']:
                    lines.append(f"- {used_hook}")
            lines.append("")
        
        # Navigation Routes
        lines.append("## Navigation Routes")
        for route in self.navigation_routes:
            component_str = f" → {route['component']}" if route['component'] else ""
            lines.append(f"- {route['name']}{component_str}")
        
        # API Endpoints
        lines.append("\n## API Endpoints")
        for endpoint in self.api_endpoints:
            lines.append(f"- {endpoint['endpoint']} (from {endpoint['service']})")
        
        # Database Schemas Section
        if self.database_schemas:
            lines.append("\n## Database Schemas")
            for schema in self.database_schemas:
                lines.append(f"\n### Table: {schema['table_name']}")
                
                # Columns
                lines.append("#### Columns")
                for column in schema['columns']:
                    nullable = "NULL" if column.get('nullable', True) else "NOT NULL"
                    default = f" DEFAULT {column['default']}" if 'default' in column else ""
                    pk = " PRIMARY KEY" if column['name'] in schema['primary_keys'] else ""
                    lines.append(f"- {column['name']}: {column['type']} {nullable}{default}{pk}")
                
                # Primary Keys
                if schema['primary_keys']:
                    lines.append("\n#### Primary Keys")
                    for pk in schema['primary_keys']:
                        lines.append(f"- {pk}")
                
                # Foreign Keys
                if schema['foreign_keys']:
                    lines.append("\n#### Foreign Keys")
                    for fk in schema['foreign_keys']:
                        lines.append(f"- {fk['column']} → {fk['ref_table']}.{fk['ref_column']}")
                
                # Indices
                if schema['indices']:
                    lines.append("\n#### Indices")
                    for idx in schema['indices']:
                        unique = "UNIQUE " if idx['unique'] else ""
                        lines.append(f"- {unique}INDEX {idx['name']} ({', '.join(idx['columns'])})")
        
        # Module Dependencies Section
        if self.import_dependencies:
            lines.append("\n## Module Dependencies")
            
            # Group dependencies by source
            by_source = defaultdict(list)
            for dep in self.import_dependencies:
                if 'source' in dep:
                    by_source[dep['source']].append(dep)
            
            # Take the top most imported modules
            top_modules = sorted(by_source.items(), key=lambda x: len(x[1]), reverse=True)[:10]
            
            lines.append("\n### Top Imported Modules")
            lines.append("| Module | Import Count | Types |")
            lines.append("|--------|--------------|-------|")
            
            for source, deps in top_modules:
                named = len([d for d in deps if d.get('type') == 'named'])
                default = len([d for d in deps if d.get('type') == 'default'])
                side_effect = len([d for d in deps if d.get('type') == 'side_effect'])
                
                types = []
                if named > 0:
                    types.append(f"{named} named")
                if default > 0:
                    types.append(f"{default} default")
                if side_effect > 0:
                    types.append(f"{side_effect} side-effect")
                
                lines.append(f"| {source} | {len(deps)} | {', '.join(types)} |")
        
        # Type System Analysis
        if self.complex_types:
            lines.append("\n## Type System Analysis")
            
            # Count interfaces and types
            interfaces = [t for t in self.complex_types if 'properties' in t]
            types = [t for t in self.complex_types if 'definition' in t]
            
            if interfaces:
                lines.append(f"\n### Interfaces ({len(interfaces)} defined)")
                
                # Show top 5 most complex interfaces
                complex_interfaces = sorted(interfaces, key=lambda x: len(x.get('properties', [])), reverse=True)[:5]
                
                lines.append("| Interface | Properties | Extends |")
                lines.append("|-----------|------------|---------|")
                
                for interface in complex_interfaces:
                    extends = interface.get('extends', 'N/A')
                    lines.append(f"| {interface['name']} | {len(interface.get('properties', []))} | {extends} |")
            
            if types:
                lines.append(f"\n### Type Aliases ({len(types)} defined)")
                
                # Count by category
                categories = {}
                for t in types:
                    cat = t.get('category', 'unknown')
                    categories[cat] = categories.get(cat, 0) + 1
                
                lines.append("| Category | Count |")
                lines.append("|----------|-------|")
                
                for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                    lines.append(f"| {cat} | {count} |")
        
        # Enhanced API Endpoints
        if self.enhanced_api_endpoints:
            lines.append("\n## Enhanced API Documentation")
            
            # Group by method
            by_method = defaultdict(list)
            for endpoint in self.enhanced_api_endpoints:
                by_method[endpoint['method']].append(endpoint)
            
            method_count = {method: len(endpoints) for method, endpoints in by_method.items()}
            
            lines.append("| HTTP Method | Endpoint Count |")
            lines.append("|------------|---------------|")
            
            for method, count in sorted(method_count.items(), key=lambda x: x[1], reverse=True):
                lines.append(f"| {method} | {count} |")
            
            lines.append("\n### Sample Endpoints")
            for method, endpoints in sorted(by_method.items(), key=lambda x: len(x[1]), reverse=True)[:3]:
                lines.append(f"\n#### {method} Endpoints (showing top 3)")
                for endpoint in endpoints[:3]:
                    lines.append(f"- `{endpoint['endpoint']}`")
                    if endpoint.get('function'):
                        lines.append(f"  - Function: `{endpoint['function']}`")
        
        # Security Analysis
        if self.security_patterns:
            lines.append("\n## Security Analysis")
            
            # Group by issue type
            by_issue = defaultdict(list)
            for concern in self.security_patterns:
                by_issue[concern['issue']].append(concern)
            
            lines.append("| Security Concern | Occurrences |")
            lines.append("|------------------|-------------|")
            
            for issue, concerns in sorted(by_issue.items(), key=lambda x: len(x[1]), reverse=True):
                lines.append(f"| {issue} | {len(concerns)} |")
        
        return "\n".join(lines)

    def format_file_summary(self, file_path: str, rel_path: str, file_info: Dict[str, Any]) -> List[str]:
        """Format the summary of a file for the output"""
        ext = os.path.splitext(file_path)[1].lower()
        lines = []
        
        if ext in ['.tsx', '.ts', '.jsx', '.js']:
            # Add imports summary
            if file_info.get('imports'):
                lines.append("# Imports:")
                for import_info in file_info['imports'][:5]:  # Show first 5 imports
                    module = import_info['module']
                    imports = ", ".join(import_info['imports'])
                    lines.append(f"# import {{ {imports} }} from '{module}'")
                
                if len(file_info['imports']) > 5:
                    lines.append(f"# ... and {len(file_info['imports']) - 5} more imports")
                
                lines.append("")
            
            # Add components
            if file_info.get('components'):
                lines.append("# Components:")
                for component in file_info['components']:
                    lines.extend(self.format_component_info(component))
                    lines.append("")
            
            # Add hooks
            if file_info.get('hooks'):
                lines.append("# Hooks:")
                for hook in file_info['hooks']:
                    lines.extend(self.format_hook_info(hook))
                    lines.append("")
            
            # Add services
            if file_info.get('services'):
                lines.append("# Services:")
                for service in file_info['services']:
                    lines.extend(self.format_service_info(service))
                    lines.append("")
            
            # Add types
            if file_info.get('types') and any(file_info['types'].values()):
                lines.append("# Type Definitions:")
                lines.extend(self.format_type_info(file_info['types']))
                lines.append("")
            
            # Add navigation
            if file_info.get('navigation'):
                lines.append("# Navigation:")
                lines.extend(self.format_navigation_info(file_info['navigation']))
                lines.append("")
            
            # Add state management
            if file_info.get('state_management'):
                lines.append("# State Management:")
                lines.extend(self.format_state_management_info(file_info['state_management']))
                lines.append("")
        
        elif ext == '.json':
            # For JSON files, try to parse and summarize
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    json_data = json.load(f)
                
                lines.append("# JSON Structure:")
                
                # For package.json, show dependencies
                if file_path.endswith('package.json'):
                    if 'dependencies' in json_data:
                        lines.append("# Dependencies:")
                        for dep, version in list(json_data['dependencies'].items())[:10]:
                            lines.append(f"#   {dep}: {version}")
                        
                        if len(json_data['dependencies']) > 10:
                            lines.append(f"#   ... and {len(json_data['dependencies']) - 10} more dependencies")
                    
                    if 'devDependencies' in json_data:
                        lines.append("# Dev Dependencies:")
                        for dep, version in list(json_data['devDependencies'].items())[:5]:
                            lines.append(f"#   {dep}: {version}")
                        
                        if len(json_data['devDependencies']) > 5:
                            lines.append(f"#   ... and {len(json_data['devDependencies']) - 5} more dev dependencies")
                    
                    if 'scripts' in json_data:
                        lines.append("# Scripts:")
                        for script, command in list(json_data['scripts'].items())[:5]:
                            lines.append(f"#   {script}: {command}")
                        
                        if len(json_data['scripts']) > 5:
                            lines.append(f"#   ... and {len(json_data['scripts']) - 5} more scripts")
                else:
                    # For other JSON files, show top-level keys
                    lines.append("# Top-level keys:")
                    for key in json_data.keys():
                        value_type = type(json_data[key]).__name__
                        lines.append(f"#   {key}: {value_type}")
            
            except json.JSONDecodeError:
                lines.append("# Invalid JSON file")
            
            lines.append("")
        
        else:
            # Basic info for other file types
            lines.append(f"# {ext[1:]} file - detailed extraction not supported")
        
        return lines

    def process_file(self, file_path: str) -> Dict[str, Any]:
        """Process a file based on its type"""
        ext = os.path.splitext(file_path)[1].lower()
        result = {}
        
        if ext in ['.tsx', '.ts', '.jsx', '.js']:
            result = self.process_tsx_file(file_path)
        elif ext == '.json':
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    json_data = json.load(f)
                result = {'json_data': json_data}
            except json.JSONDecodeError:
                result = {'error': 'Invalid JSON file'}
        else:
            # Just return basic info for other file types
            result = {"type": ext[1:], "info": f"File summary not available for {ext} files"}
        
        # Add database schema extraction
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            # Extract database schema regardless of file type
            db_schemas = self.extract_database_schema(content, file_path)
            if db_schemas.get('schemas'):
                result['database_schemas'] = db_schemas
                # Add to global list of schemas
                self.database_schemas.extend(db_schemas['schemas'])
            
            # Apply new enhanced analysis functions
            if ext in ['.tsx', '.ts', '.jsx', '.js']:
                # Import dependencies
                import_deps = self.extract_import_dependencies(content, file_path)
                if import_deps.get('dependencies'):
                    result['import_dependencies'] = import_deps
                    self.import_dependencies.extend(import_deps['dependencies'])
                
                # Complex type analysis
                if ext in ['.ts', '.tsx']:
                    complex_types = self.extract_complex_types(content, file_path)
                    if complex_types.get('interfaces') or complex_types.get('types'):
                        result['complex_types'] = complex_types
                        if complex_types.get('interfaces'):
                            self.complex_types.extend(complex_types['interfaces'])
                        if complex_types.get('types'):
                            self.complex_types.extend(complex_types['types'])
                
                # Enhanced API endpoint analysis
                api_endpoints = self.extract_api_endpoints(content, file_path)
                if api_endpoints.get('api_endpoints'):
                    result['api_endpoints_enhanced'] = api_endpoints
                    self.enhanced_api_endpoints.extend(api_endpoints['api_endpoints'])
                
                # Style pattern analysis
                style_patterns = self.extract_style_patterns(content, file_path)
                if any(style_patterns.values()):
                    result['style_patterns'] = style_patterns
                    if style_patterns.get('style_definitions'):
                        self.style_patterns.extend(style_patterns['style_definitions'])
                
                # Hook usage analysis
                hook_analysis = self.analyze_hook_usage(content, file_path)
                if any(hook_analysis.values()):
                    result['hook_analysis'] = hook_analysis
                    if hook_analysis.get('hook_definitions'):
                        self.hook_usages_analysis.extend(hook_analysis['hook_definitions'])
                
                # Navigation route analysis
                nav_routes = self.extract_navigation_routes(content, file_path)
                if any(nav_routes.values()):
                    result['navigation_routes_enhanced'] = nav_routes
                    if nav_routes.get('routes'):
                        self.enhanced_navigation.extend(nav_routes['routes'])
                
                # Security pattern analysis
                security_patterns = self.analyze_security_patterns(content, file_path)
                if any(security_patterns.values()):
                    result['security_patterns'] = security_patterns
                    if security_patterns.get('security_concerns'):
                        self.security_patterns.extend(security_patterns['security_concerns'])
                
        except Exception as e:
            print(f"Error in enhanced analysis for {file_path}: {str(e)}")
        
        return result

    def extract_context(self, root_dir: str, output_file: str, format='text') -> None:
        """Extract context from codebase and write to output file"""
        print(f"Processing project directory: {root_dir}")
        print(f"Using configuration:")
        print(f"  - Exclude directories: {self.config['exclude_dirs']}")
        print(f"  - Include directories: {self.config['include_dirs']}")
        print(f"  - Exclude files: {self.config['exclude_files']}")
        print(f"  - File extensions: {self.config['extensions']}")
        print(f"  - Output format: {format}")
        
        # Collect files
        try:
            self.files = self.collect_files(root_dir)
            print(f"Found {len(self.files)} eligible files")
            self.files.sort(key=lambda x: x[1])  # Sort by relative path
        except Exception as e:
            print(f"Error collecting files: {str(e)}")
            return
        
        # Process all files to gather relationships
        processed_count = 0
        excluded_count = 0
        error_count = 0
        
        for file_path, rel_path in self.files:
            # Skip processing if we've hit line limit
            if self.total_lines >= self.config["max_lines"]:
                print(f"Reached line limit of {self.config['max_lines']} lines. Stopping...")
                break
                
            try:
                # Process the file
                file_info = self.process_file(file_path)
                processed_count += 1
                
                # Format the file summary
                summary_lines = self.format_file_summary(file_path, rel_path, file_info)
                
                # Skip if no useful info extracted
                if not summary_lines:
                    excluded_count += 1
                    continue
                    
                # Check if adding this file would exceed our line limit
                if self.total_lines + len(summary_lines) + 3 > self.config["max_lines"]:
                    print(f"Reached target line limit ({self.config['max_lines']}). Stopping...")
                    break
                    
                # Add file info with header
                self.file_summaries.append({
                    "path": rel_path,
                    "lines": summary_lines
                })
                
                self.total_lines += len(summary_lines) + 3  # +3 for separator and file name lines
                
                # Periodically report progress
                if processed_count % 10 == 0:
                    print(f"Processed {processed_count} files, total lines: {self.total_lines}")
            
            except Exception as e:
                print(f"Error processing file {rel_path}: {str(e)}")
                error_count += 1
        
        print(f"Processing complete:")
        print(f"  - Processed: {processed_count} files")
        print(f"  - Excluded (no useful info): {excluded_count} files")
        print(f"  - Errors: {error_count} files")
        
        # Now generate output in the requested format
        try:
            output_content = self.generate_output(format)
            with open(output_file, 'w', encoding='utf-8') as out:
                out.write(output_content)
            
            print(f"Context extraction complete! Generated output in {format} format to {output_file}")
        except Exception as e:
            print(f"Error writing to output file: {str(e)}")

    def process_tsx_file(self, file_path: str) -> Dict[str, Any]:
        """Process a TypeScript/JavaScript file and extract information"""
        result = {}
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                
            # Extract components
            components = self.extract_react_component(content, file_path)
            if components:
                result['components'] = components
                
            # Extract hooks
            hooks = self.extract_hooks(content, file_path)
            if hooks:
                result['hooks'] = hooks
                
            # Extract services
            services = self.extract_services(content, file_path)
            if services:
                result['services'] = services
                
            # Extract type information
            types = self.extract_types(content, file_path)
            if any(types.values()):
                result['types'] = types
                
            # Extract navigation information
            navigation = self.extract_navigation(content, file_path)
            if navigation:
                result['navigation'] = navigation
                
            # Extract state management
            state_management = self.extract_state_management(content, file_path)
            if state_management:
                result['state_management'] = state_management
                
            # Extract import information (basic version)
            imports = []
            import_pattern = r'import\s+(?:{([^}]+)}|(\w+))\s+from\s+[\'"]([^\'"]+)[\'"]'
            import_matches = re.finditer(import_pattern, content)
            
            for match in import_matches:
                if match.group(1):  # Named imports
                    imports_list = [name.strip() for name in match.group(1).split(',')]
                    imports.append({
                        'module': match.group(3),
                        'imports': imports_list
                    })
                elif match.group(2):  # Default import
                    imports.append({
                        'module': match.group(3),
                        'imports': [match.group(2)]
                    })
                    
            if imports:
                result['imports'] = imports
            
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")
            return {'error': str(e)}
            
        return result

    def generate_text_output(self):
        """Generate text-based output"""
        lines = []
        
        # Header
        lines.append("=== AI KNOWLEDGE BASE CODE CONTEXT ===")
        lines.append(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"Total files processed: {len(self.files)}")
        lines.append("")
        
        # Component Complexity Section
        if self.component_complexity:
            lines.append("=== COMPONENT COMPLEXITY ===")
            lines.append("(Components with complexity > 10, sorted by complexity)")
            lines.append("Component Name | Complexity | File")
            lines.append("--------------|------------|-----")
            
            sorted_components = sorted(self.component_complexity, key=lambda x: x['complexity'], reverse=True)
            for component in sorted_components[:20]:  # Show top 20
                file_name = os.path.basename(component['file_path'])
                lines.append(f"{component['name']} | {component['complexity']} | {file_name}")
            
            lines.append("")
            lines.append("Complexity Guidelines:")
            lines.append("- 0-5: Simple component")
            lines.append("- 6-10: Moderate complexity")
            lines.append("- 11-20: Complex component")
            lines.append("- 21+: Very complex, consider refactoring")
            lines.append("")
        
        # Hooks Section
        if self.hooks:
            lines.append("=== CUSTOM HOOKS ===")
            for hook in self.hooks:
                lines.append(f"Hook: {hook['name']} (from {os.path.basename(hook['file_path'])})")
                
                if hook['params']:
                    lines.append("  Parameters:")
                    for param in hook['params']:
                        lines.append(f"    - {param['name']}: {param.get('type', 'any')}")
                
                if hook['returns']:
                    lines.append("  Returns:")
                    for ret in hook['returns']:
                        lines.append(f"    - {ret}")
                
                if hook['uses_hooks']:
                    lines.append("  Uses hooks:")
                    for used_hook in hook['uses_hooks']:
                        lines.append(f"    - {used_hook}")
                
                if hook['api_calls']:
                    lines.append("  API calls:")
                    for api_call in hook['api_calls']:
                        lines.append(f"    - {api_call}")
                
                lines.append("")
        
        # Services Section
        if self.services:
            lines.append("=== SERVICES ===")
            for service in self.services:
                singleton = " (Singleton)" if service.get('is_singleton') else ""
                parent = f" extends {service['parent_class']}" if service.get('parent_class') else ""
                lines.append(f"Service: {service['name']}{singleton}{parent} (from {os.path.basename(service['file_path'])})")
                
                if service['methods']:
                    lines.append("  Methods:")
                    for method in service['methods']:
                        params = ', '.join([f"{p['name']}: {p['type']}" for p in method['params']])
                        return_type = f" -> {method['return_type']}" if method.get('return_type') else ""
                        lines.append(f"    - {method['name']}({params}){return_type}")
                
                if service['api_endpoints']:
                    lines.append("  API Endpoints:")
                    for endpoint in service['api_endpoints']:
                        lines.append(f"    - {endpoint}")
                
                lines.append("")
        
        # API Endpoints Section
        if self.api_endpoints:
            lines.append("=== API ENDPOINTS ===")
            for endpoint in self.api_endpoints:
                lines.append(f"Endpoint: {endpoint['endpoint']}")
                lines.append(f"  Service: {endpoint['service']}")
                lines.append(f"  File: {os.path.basename(endpoint['file_path'])}")
                lines.append("")
        
        # Navigation Routes Section
        if self.navigation_routes:
            lines.append("=== NAVIGATION ROUTES ===")
            for route in self.navigation_routes:
                component = f" -> {route['component']}" if route.get('component') else ""
                lines.append(f"Route: {route['name']}{component}")
                lines.append(f"  File: {os.path.basename(route['file_path'])}")
                lines.append("")
        
        # State Management Section
        if self.state_management:
            lines.append("=== STATE MANAGEMENT ===")
            
            # Group by type
            state_by_type = {}
            for state in self.state_management:
                if state['type'] not in state_by_type:
                    state_by_type[state['type']] = []
                state_by_type[state['type']].append(state)
            
            for state_type, states in state_by_type.items():
                lines.append(f"{state_type.replace('_', ' ').title()}:")
                for state in states:
                    lines.append(f"  - {state['name']} (from {os.path.basename(state['file_path'])})")
                lines.append("")
        
        # Database Schemas Section
        if self.database_schemas:
            lines.append("=== DATABASE SCHEMAS ===")
            for schema in self.database_schemas:
                lines.append(f"Table: {schema['table_name']} (from {os.path.basename(schema['file_path'])})")
                
                # Columns
                lines.append("  Columns:")
                for column in schema['columns']:
                    nullable = "NULL" if column.get('nullable', True) else "NOT NULL"
                    default = f" DEFAULT {column['default']}" if 'default' in column else ""
                    pk = " PRIMARY KEY" if column['name'] in schema['primary_keys'] else ""
                    lines.append(f"    - {column['name']}: {column['type']} {nullable}{default}{pk}")
                
                # Primary Keys
                if schema['primary_keys']:
                    lines.append("  Primary Keys:")
                    for pk in schema['primary_keys']:
                        lines.append(f"    - {pk}")
                
                # Foreign Keys
                if schema['foreign_keys']:
                    lines.append("  Foreign Keys:")
                    for fk in schema['foreign_keys']:
                        lines.append(f"    - {fk['column']} → {fk['ref_table']}.{fk['ref_column']}")
                
                # Indices
                if schema['indices']:
                    lines.append("  Indices:")
                    for idx in schema['indices']:
                        unique = "UNIQUE " if idx['unique'] else ""
                        lines.append(f"    - {unique}INDEX {idx['name']} ({', '.join(idx['columns'])})")
                
                lines.append("")
        
        # Module Dependencies Section
        if self.import_dependencies:
            lines.append("=== MODULE DEPENDENCIES ===")
            
            # Group dependencies by source
            by_source = defaultdict(list)
            for dep in self.import_dependencies:
                if 'source' in dep:
                    by_source[dep['source']].append(dep)
            
            # Take top 20 most imported modules
            top_modules = sorted(by_source.items(), key=lambda x: len(x[1]), reverse=True)[:20]
            
            for source, deps in top_modules:
                named = len([d for d in deps if d.get('type') == 'named'])
                default = len([d for d in deps if d.get('type') == 'default'])
                side_effect = len([d for d in deps if d.get('type') == 'side_effect'])
                
                types = []
                if named > 0:
                    types.append(f"{named} named")
                if default > 0:
                    types.append(f"{default} default")
                if side_effect > 0:
                    types.append(f"{side_effect} side-effect")
                
                lines.append(f"Module: {source} - {len(deps)} imports ({', '.join(types)})")
            
            lines.append("")
        
        # Type System Analysis
        if self.complex_types:
            lines.append("=== TYPE SYSTEM ANALYSIS ===")
            
            # Count interfaces and types
            interfaces = [t for t in self.complex_types if 'properties' in t]
            types = [t for t in self.complex_types if 'definition' in t]
            
            lines.append(f"Total Interfaces: {len(interfaces)}")
            lines.append(f"Total Type Aliases: {len(types)}")
            lines.append("")
            
            if interfaces:
                lines.append("Most Complex Interfaces:")
                
                # Show top 5 most complex interfaces
                complex_interfaces = sorted(interfaces, key=lambda x: len(x.get('properties', [])), reverse=True)[:5]
                
                for interface in complex_interfaces:
                    extends = f" extends {interface['extends']}" if interface.get('extends') else ""
                    lines.append(f"- {interface['name']}{extends} - {len(interface.get('properties', []))} properties")
            
            lines.append("")
            
            if types:
                lines.append("Type Alias Categories:")
                
                # Count by category
                categories = {}
                for t in types:
                    cat = t.get('category', 'unknown')
                    categories[cat] = categories.get(cat, 0) + 1
                
                for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                    lines.append(f"- {cat}: {count}")
            
            lines.append("")
        
        # Enhanced API Documentation
        if self.enhanced_api_endpoints:
            lines.append("=== ENHANCED API DOCUMENTATION ===")
            
            # Group by method
            by_method = defaultdict(list)
            for endpoint in self.enhanced_api_endpoints:
                by_method[endpoint['method']].append(endpoint)
            
            for method, endpoints in sorted(by_method.items()):
                lines.append(f"{method} Endpoints ({len(endpoints)}):")
                for endpoint in endpoints[:10]:  # Show top 10 of each method
                    lines.append(f"- {endpoint['endpoint']}")
                    if endpoint.get('function'):
                        lines.append(f"  Function: {endpoint['function']}")
                    if endpoint.get('return_type'):
                        lines.append(f"  Returns: {endpoint['return_type']}")
                
                if len(endpoints) > 10:
                    lines.append(f"  ... and {len(endpoints) - 10} more {method} endpoints")
                
                lines.append("")
        
        # Style Patterns
        if self.style_patterns:
            lines.append("=== STYLE PATTERNS ===")
            
            total_style_rules = sum(len(style.get('style_patterns', [])) for style in self.style_patterns) 
            lines.append(f"Total StyleSheet Rules: {total_style_rules}")
            
            inline_count = sum(1 for pattern in self.style_patterns if pattern.get('inline_styles'))
            if inline_count > 0:
                lines.append(f"Components with Inline Styles: {inline_count}")
            
            lines.append("")
        
        # Hook Usage Analysis
        if self.hook_usages_analysis:
            lines.append("=== ENHANCED HOOK ANALYSIS ===")
            
            for hook in self.hook_usages_analysis:
                lines.append(f"Hook: {hook['name']}")
                
                if hook.get('states'):
                    lines.append(f"  State Variables: {len(hook['states'])}")
                    for state in hook['states'][:3]:  # Show first 3
                        initial = f" = {state['initial_value']}" if state.get('initial_value') else ""
                        lines.append(f"    - {state['name']}{initial}")
                    
                    if len(hook['states']) > 3:
                        lines.append(f"    ... and {len(hook['states']) - 3} more state variables")
                
                if hook.get('effects'):
                    lines.append(f"  Effects: {len(hook['effects'])}")
                    for effect in hook['effects'][:2]:  # Show first 2
                        deps = ", ".join(effect['dependencies']) if effect['dependencies'] else "[]"
                        lines.append(f"    - Dependencies: [{deps}]")
                    
                    if len(hook['effects']) > 2:
                        lines.append(f"    ... and {len(hook['effects']) - 2} more effects")
                
                if hook.get('memoized'):
                    callbacks = len([m for m in hook['memoized'] if m['type'] == 'callback'])
                    memos = len([m for m in hook['memoized'] if m['type'] == 'memo'])
                    
                    if callbacks > 0:
                        lines.append(f"  Callbacks: {callbacks}")
                    
                    if memos > 0:
                        lines.append(f"  Memoized Values: {memos}")
                    
                    lines.append("")
        
        # Navigation Routes Analysis
        if self.enhanced_navigation:
            lines.append("=== ENHANCED NAVIGATION ROUTES ===")
            
            # Group by type
            routes_by_type = defaultdict(list)
            for route in self.enhanced_navigation:
                routes_by_type[route.get('type', 'Unknown')].append(route)
            
            for route_type, routes in routes_by_type.items():
                lines.append(f"{route_type} Routes ({len(routes)}):")
                
                for route in routes[:10]:  # Show top 10 of each type
                    options = f" (with options)" if route.get('options') else ""
                    lines.append(f"- {route['name']}{options}")
                
                if len(routes) > 10:
                    lines.append(f"  ... and {len(routes) - 10} more {route_type} routes")
                
                lines.append("")
        
        # Security Analysis
        if self.security_patterns:
            lines.append("=== SECURITY ANALYSIS ===")
            
            # Group by issue
            issues_by_type = defaultdict(list)
            for issue in self.security_patterns:
                issues_by_type[issue.get('issue', 'Unknown')].append(issue)
            
            for issue_type, issues in sorted(issues_by_type.items(), key=lambda x: len(x[1]), reverse=True):
                lines.append(f"{issue_type} ({len(issues)} occurrences):")
                
                for i, issue in enumerate(issues[:5]):  # Show first 5 examples
                    file_name = os.path.basename(issue['file_path'])
                    context = issue['context'][:100] + "..." if len(issue['context']) > 100 else issue['context']
                    lines.append(f"- In {file_name}: `{context}`")
                
                if len(issues) > 5:
                    lines.append(f"  ... and {len(issues) - 5} more occurrences")
                
                lines.append("")
        
        # File Summaries
        if self.file_summaries:
            lines.append("=== FILE SUMMARIES ===")
            
            for file_info in self.file_summaries:
                lines.append(f"=== {file_info['path']} ===")
                lines.extend(file_info['lines'])
                lines.append("")
                lines.append("-" * 80)
                lines.append("")
        
        return "\n".join(lines)

    def format_component_info(self, component: Dict[str, Any]) -> List[str]:
        """Format component information for the output"""
        lines = []
        lines.append(f"Component: {component['name']} ({component['type']})")
        
        if component.get('props'):
            lines.append("  Props:")
            for prop in component['props']:
                lines.append(f"    - {prop['name']}: {prop.get('type', 'any')}")
        
        if component.get('hooks_used'):
            lines.append("  Hooks used:")
            for hook in component['hooks_used']:
                lines.append(f"    - {hook}")
        
        if component.get('api_calls'):
            lines.append("  API calls:")
            for api_call in component['api_calls']:
                lines.append(f"    - {api_call}")
        
        if component.get('performance_issues'):
            lines.append("  Performance issues:")
            for issue in component['performance_issues']:
                lines.append(f"    - {issue}")
        
        if component.get('react_native_issues'):
            lines.append("  React Native issues:")
            for issue in component['react_native_issues']:
                lines.append(f"    - {issue}")
        
        return lines
    
    def format_hook_info(self, hook: Dict[str, Any]) -> List[str]:
        """Format hook information for the output"""
        lines = []
        lines.append(f"Hook: {hook['name']}")
        
        if hook.get('params'):
            lines.append("  Parameters:")
            for param in hook['params']:
                lines.append(f"    - {param['name']}: {param.get('type', 'any')}")
        
        if hook.get('returns'):
            lines.append("  Returns:")
            for ret in hook['returns']:
                lines.append(f"    - {ret}")
        
        if hook.get('uses_hooks'):
            lines.append("  Uses hooks:")
            for used_hook in hook['uses_hooks']:
                lines.append(f"    - {used_hook}")
        
        if hook.get('api_calls'):
            lines.append("  API calls:")
            for api_call in hook['api_calls']:
                lines.append(f"    - {api_call}")
        
        return lines
    
    def format_service_info(self, service: Dict[str, Any]) -> List[str]:
        """Format service information for the output"""
        lines = []
        singleton = " (Singleton)" if service.get('is_singleton') else ""
        parent = f" extends {service['parent_class']}" if service.get('parent_class') else ""
        lines.append(f"Service: {service['name']}{singleton}{parent}")
        
        if service.get('methods'):
            lines.append("  Methods:")
            for method in service['methods']:
                params = ', '.join([f"{p['name']}: {p['type']}" for p in method['params']])
                return_type = f" -> {method['return_type']}" if method.get('return_type') else ""
                lines.append(f"    - {method['name']}({params}){return_type}")
        
        if service.get('api_endpoints'):
            lines.append("  API Endpoints:")
            for endpoint in service['api_endpoints']:
                lines.append(f"    - {endpoint}")
        
        return lines
    
    def format_type_info(self, types: Dict[str, List[Dict[str, Any]]]) -> List[str]:
        """Format type information for the output"""
        lines = []
        
        if types.get('interfaces'):
            lines.append("  Interfaces:")
            for interface in types['interfaces']:
                parent = f" extends {interface['parent']}" if interface.get('parent') else ""
                lines.append(f"    - {interface['name']}{parent}")
                
                if interface.get('properties'):
                    for prop in interface['properties']:
                        lines.append(f"      - {prop['name']}: {prop['type']}")
        
        if types.get('types'):
            lines.append("  Type Aliases:")
            for type_alias in types['types']:
                lines.append(f"    - {type_alias['name']} = {type_alias['definition']}")
        
        if types.get('enums'):
            lines.append("  Enums:")
            for enum in types['enums']:
                lines.append(f"    - {enum['name']}")
                
                if enum.get('values'):
                    for val in enum['values']:
                        value = f" = {val['value']}" if val.get('value') else ""
                        lines.append(f"      - {val['name']}{value}")
        
        return lines
    
    def format_navigation_info(self, navigation: List[Dict[str, Any]]) -> List[str]:
        """Format navigation information for the output"""
        lines = []
        
        for route in navigation:
            component_str = f" -> {route['component']}" if route.get('component') else ""
            lines.append(f"  Route: {route['name']}{component_str}")
        
        return lines
    
    def format_state_management_info(self, state_management: List[Dict[str, Any]]) -> List[str]:
        """Format state management information for the output"""
        lines = []
        
        # Group by type
        state_by_type = {}
        for state in state_management:
            if state['type'] not in state_by_type:
                state_by_type[state['type']] = []
            state_by_type[state['type']].append(state)
        
        for state_type, states in state_by_type.items():
            lines.append(f"  {state_type.replace('_', ' ').title()}:")
            for state in states:
                lines.append(f"    - {state['name']}")
        
        return lines
    
    def format_database_schema(self, schema: Dict[str, Any]) -> List[str]:
        """Format database schema information for the output"""
        lines = []
        
        for db_schema in schema.get('schemas', []):
            lines.append(f"  Table: {db_schema['table_name']}")
            
            # Columns
            lines.append("    Columns:")
            for column in db_schema['columns']:
                nullable = "NULL" if column.get('nullable', True) else "NOT NULL"
                default = f" DEFAULT {column['default']}" if 'default' in column else ""
                pk = " PRIMARY KEY" if column['name'] in db_schema['primary_keys'] else ""
                lines.append(f"      - {column['name']}: {column['type']} {nullable}{default}{pk}")
            
            # Primary Keys
            if db_schema['primary_keys']:
                lines.append("    Primary Keys:")
                for pk in db_schema['primary_keys']:
                    lines.append(f"      - {pk}")
            
            # Foreign Keys
            if db_schema['foreign_keys']:
                lines.append("    Foreign Keys:")
                for fk in db_schema['foreign_keys']:
                    lines.append(f"      - {fk['column']} → {fk['ref_table']}.{fk['ref_column']}")
            
            # Indices
            if db_schema['indices']:
                lines.append("    Indices:")
                for idx in db_schema['indices']:
                    unique = "UNIQUE " if idx['unique'] else ""
                    lines.append(f"      - {unique}INDEX {idx['name']} ({', '.join(idx['columns'])})")
        
        return lines

def main():
    """Main function to execute the script"""
    parser = argparse.ArgumentParser(description="Extract structured context from a React Native/TypeScript codebase")
    parser.add_argument("output_file", nargs="?", default="code_context.txt", 
                      help="Output file path (default: code_context.txt)")
    parser.add_argument("--root-dir", "-d", default=os.getcwd(),
                      help="Root directory to process (default: current directory)")
    parser.add_argument("--exclude", "-e", action="append", default=[],
                      help="Additional directories to exclude (can be used multiple times)")
    parser.add_argument("--include", "-i", action="append", default=[],
                      help="Additional directories to include (can be used multiple times)")
    parser.add_argument("--max-lines", "-m", type=int, default=DEFAULT_CONFIG["max_lines"],
                      help=f"Maximum number of lines in output (default: {DEFAULT_CONFIG['max_lines']})")
    parser.add_argument("--format", "-f", choices=["text", "json", "markdown", "html"], default="text",
                      help="Output format (default: text)")
    parser.add_argument("--analyze-performance", "-p", action="store_true",
                      help="Include performance analysis")
    parser.add_argument("--analyze-data-flow", "-df", action="store_true",
                      help="Include data flow analysis")
    parser.add_argument("--show-component-tree", "-t", action="store_true",
                      help="Include component hierarchy tree")
    parser.add_argument("--analyze-react-native", "-rn", action="store_true",
                      help="Include React Native specific analysis")
    
    args = parser.parse_args()
    
    # Create a copy of the default config
    config = DEFAULT_CONFIG.copy()
    
    # Update config with command-line args
    config["exclude_dirs"].extend(args.exclude)
    config["include_dirs"].extend(args.include)
    config["max_lines"] = args.max_lines
    config["analyze_performance"] = args.analyze_performance
    config["analyze_data_flow"] = args.analyze_data_flow
    config["show_component_tree"] = args.show_component_tree
    config["analyze_react_native"] = args.analyze_react_native
    
    try:
        extractor = CodeContextExtractor(config)
        extractor.extract_context(args.root_dir, args.output_file, format=args.format)
    except KeyboardInterrupt:
        print("\nExtraction stopped by user.")
    except Exception as e:
        print(f"Error during extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()