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

export const getCorrectorLocation = (id: any, users: any) => {
    let location = null;
    users.map((i: any) => {
        console.log("i.id == id", i.id, id)
        if (i.id == id)
            location = `https://friends.42paris.fr/?cluster=paul-f4&p=${i.location}`; // i.location
    });
    if (!location)
        location = "";
    return (location);
}
