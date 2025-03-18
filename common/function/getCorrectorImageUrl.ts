export const getCorrectorImageUrl = (id: any, users: any, me: any) => {
    let image = null;
    users.map((i: any) => {
        if (i.id == id)
            image = i.image;
    });
    if (!image)
        image = me.image.versions.small;
    return (image);
};

export const getCorrectorName = (id: any, users: any, me: any) => {
    let image = null;
    users.map((i: any) => {
        if (i.id == id)
            image = i.usual_full_name;
    });
    if (!image)
        image = me.usual_full_name;
    return (image);
};