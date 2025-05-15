/* Assign one source dict to target (copy only properties which exists) */

function assignArgs(target, source) {
    if (Object(target) !== target || Object(source) !== source)
        return source;
    for (const p in source)
        if (p in target) target[p] = assignArgs(target[p], source[p]);
    return target;
}
