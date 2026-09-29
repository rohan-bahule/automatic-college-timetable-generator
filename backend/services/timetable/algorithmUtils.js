const _to_min = (t) => {
    try {
        if (!t) return 0;
        const parts = t.trim().split(':');
        if (parts.length !== 2) return 0;
        let h = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return 0;
        
        // 1 to 7 is converted to PM (13 to 19)
        if (1 <= h && h <= 7) {
            h += 12;
        }
        return h * 60 + m;
    } catch (e) {
        return 0;
    }
};

const _parse = (time_str) => {
    try {
        if (!time_str) return [0, 0];
        const parts = time_str.replace(/ /g, '').split('-');
        if (parts.length !== 2) return [0, 0];
        return [_to_min(parts[0]), _to_min(parts[1])];
    } catch (e) {
        return [0, 0];
    }
};

const _get_slot_priority = (time_str) => {
    if (!time_str) return 99;
    if (time_str.includes('08:45')) return 1;
    if (time_str.includes('11:00')) return 2;
    if (time_str.includes('13:45')) return 3;
    return 99;
};

const _is_lab_slot_consecutive = (time1_str, time2_str) => {
    const [s1, e1] = _parse(time1_str);
    const [s2, e2] = _parse(time2_str);
    return (e1 === s2) || (e2 === s1);
};

const _times_overlap = (time1_str, time2_str) => {
    const [s1, e1] = _parse(time1_str);
    const [s2, e2] = _parse(time2_str);
    return Math.max(s1, s2) < Math.min(e1, e2);
};

module.exports = {
    _to_min,
    _parse,
    _get_slot_priority,
    _is_lab_slot_consecutive,
    _times_overlap
};
