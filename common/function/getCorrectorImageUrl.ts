export const getCorrectorImageUrl = (id: any, users: any, me: any) => {
    let image = null;
    users.map((i: any) => {
        if (i.id == id)
            image = i.image;
    });
    if (!image)
        image = me?.image?.versions.small;
    return (image);
};

export const getCorrectorName = (id: any, users: any, me: any) => {
    let name = null;
    users.map((i: any) => {
        if (i.id == id) {
            name = `${i.usual_full_name} (${i.login})`;
        }
    });
    if (!name)
        name = me.usual_full_name;
    return (name);
};


export const getRentre = (id: any, users: any, me: any) => {
    let name = null;
    users.map((i: any) => {
        if (i.id == id) {
            name = `${i.pool_month} ${i.pool_year}`;
        }
    });
    return (name);
};

export const getLevel = (id: any, users: any, me: any) => {
    let name = null;
    users.map((i: any) => {
        if (i.id == id) {
            name = `${i.level} lvl`;
        }
    });
    if (!name)
        return "...";
    return (name);
};