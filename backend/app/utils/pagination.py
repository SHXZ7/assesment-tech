import math


def build_pagination_response(items, total: int, page: int, limit: int):
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if limit else 0,
    }
