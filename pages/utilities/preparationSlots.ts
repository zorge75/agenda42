export const preparationSlots = (data: any) => {
    let sortedData = Object.isFrozen(data) ? [...data] : data;
    let sorted = sortedData.sort((a: any, b: any) =>
        new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime()
    );
    let item_buffer: any;
    let slots_data: any[] = [];
    let res: any[] = [];

    console.log('sorted', sorted);

    if (sorted.length === 0) return res;

    // Initialize with first item
    item_buffer = { ...sorted[0] };
    slots_data.push(sorted[0]); // Include first item in slots_data

    // Start loop from second item
    for (let i = 1; i < sorted.length; i++) {
        let current_item = sorted[i];

        if (item_buffer.end_at === current_item.begin_at) {
            item_buffer.end_at = current_item.end_at;
            slots_data.push(current_item);
        } else {
            item_buffer.slots_data = [...slots_data]; // Assign slots_data to buffer
            res.push({ ...item_buffer });
            item_buffer = { ...current_item };
            slots_data = [current_item]; // Reset with current item
        }
        console.log("slots_data", slots_data);
    }

    // Push the final buffer with its slots_data
    item_buffer.slots_data = [...slots_data];
    res.push({ ...item_buffer });

    console.log("PREPARATION: ", res);
    return res;
};