export const getCorrectorImageUrl = (id: any, users: any, me: any) => {
    let image = null;
    users.map((i: any) => {
        if (i.id == id)
            image = i.image;
    });
    if (!image)
        image = me.image.versions.small;
    console.log(">>", image);
    return (image);
};