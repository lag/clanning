def fast_deep_diff(old: dict, new: dict) -> dict:
    """
    Fast deep difference calculator optimized for Clash of Clans player data.
    Only includes values that actually changed.
    """

    def get_changed_values(old_item: dict, new_item: dict) -> dict:
        """Extract only the values that changed between old and new items"""
        changed = {}
        all_keys = set(old_item) | set(new_item)
        
        for key in all_keys:
            if key not in old_item:
                changed[key] = new_item[key]
            elif key not in new_item:
                changed[key] = None
            elif old_item[key] != new_item[key]:
                changed[key] = new_item[key]
        
        return changed if changed else None

    def compare_lists(path: str, old_list: list, new_list: list) -> dict:
        """Compare lists with special handling for CoC data types"""
        if not old_list and not new_list:
            return {}
            
        # Handle empty cases
        if not old_list:
            return {'list_item_added': {path: new_list}}
        if not new_list:
            return {'list_item_removed': {path: old_list}}
            
        changes = {}
        
        # For named items (troops, achievements, etc.)
        if old_list and isinstance(old_list[0], dict) and 'name' in old_list[0]:
            old_dict = {item['name']: item for item in old_list}
            new_dict = {item['name']: item for item in new_list}
            
            # Find changes
            for name, new_item in new_dict.items():
                if name not in old_dict:
                    changes.setdefault('added', {}).setdefault(path, []).append(new_item)
                else:
                    changed_values = get_changed_values(old_dict[name], new_item)
                    if changed_values:
                        changes.setdefault('changed', {}).setdefault(path, []).append({
                            'name': name,
                            'old': {k: old_dict[name][k] for k in changed_values},
                            'new': changed_values
                        })
                    
            for name in old_dict:
                if name not in new_dict:
                    changes.setdefault('removed', {}).setdefault(path, []).append(old_dict[name])
                    
        else:
            # For non-named lists, compare directly
            if old_list != new_list:
                changes['values_changed'] = {path: {'old_value': old_list, 'new_value': new_list}}
                
        return changes

    def compare_values(path: str, old_val, new_val) -> dict:
        """Compare individual values"""
        if old_val == new_val:
            return {}
            
        # Handle different types
        if type(old_val) != type(new_val):
            return {'type_changes': {path: {
                'old_type': type(old_val).__name__,
                'new_type': type(new_val).__name__,
                'old_value': old_val,
                'new_value': new_val
            }}}
            
        # Handle dictionaries
        if isinstance(old_val, dict):
            return compare_dicts(path, old_val, new_val)
            
        # Handle lists
        if isinstance(old_val, (list, tuple)):
            return compare_lists(path, old_val, new_val)
            
        # Handle simple value changes
        return {'values_changed': {path: {'old_value': old_val, 'new_value': new_val}}}

    def compare_dicts(path: str, old_dict: dict, new_dict: dict) -> dict:
        """Compare dictionaries"""
        changes = {}
        
        # Special handling for specific CoC fields
        special_fields = {
            'troops': compare_lists,
            'achievements': compare_lists,
            'heroes': compare_lists,
            'spells': compare_lists,
            'heroEquipment': compare_lists
        }
        
        # Compare all keys
        all_keys = set(old_dict) | set(new_dict)
        for key in all_keys:
            key_path = f"{path}.{key}" if path else key
            
            # Handle removed keys
            if key not in new_dict:
                changes.setdefault('dictionary_item_removed', []).append(key_path)
                continue
                
            # Handle added keys
            if key not in old_dict:
                changes.setdefault('dictionary_item_added', []).append(key_path)
                continue
                
            # Skip if values are identical
            if old_dict[key] == new_dict[key]:
                continue
                
            # Handle special fields
            if key in special_fields:
                diff = special_fields[key](key_path, old_dict[key], new_dict[key])
                if diff:  # Only add if there are actual changes
                    for change_type, change_data in diff.items():
                        changes.setdefault(change_type, {}).update(change_data)
                continue
                
            # Handle regular fields
            diff = compare_values(key_path, old_dict[key], new_dict[key])
            if diff:  # Only add if there are actual changes
                for change_type, change_data in diff.items():
                    if isinstance(change_data, dict):
                        changes.setdefault(change_type, {}).update(change_data)
                    else:
                        changes.setdefault(change_type, []).extend(change_data)
                        
        return changes

    return compare_dicts("", old, new)

def clean_dictionary(diff_dict):
    """Simple cleaning function that ensures JSON serialization"""
    if not isinstance(diff_dict, dict):
        if isinstance(diff_dict, (set, frozenset)):
            return list(diff_dict)
        return diff_dict
    
    cleaned = {}
    for k, v in diff_dict.items():
        cleaned[k] = clean_dictionary(v)
    return cleaned