import re
import itertools

def parse_expression(expr):
    expr = expr.replace("AND", " and ")
    expr = expr.replace("OR", " or ")
    expr = expr.replace("NOT", " not ")
    
    # Handle IMP (implication)
    expr = re.sub(r'IMP', '>>', expr)
    expr = re.sub(r'(.+?)\s*>>\s*(.+)', r'((not (\1)) or (\2))', expr)
    
    # Handle IFF (equivalence)
    expr = re.sub(r'IFF', '==', expr)
    expr = re.sub(r'(.+?)\s*==\s*(.+)', r'((\1 and \2) or (not \1 and not \2))', expr)
    
    return expr

def compute_truth(n, expressions):
    vars = [chr(i) for i in range(65, 65 + n)]
    combinations = list(itertools.product([False, True], repeat=n))

    results = []
    for expr in expressions:
        parsed = parse_expression(expr)
        col = []
        for combo in combinations:
            local = dict(zip(vars, combo))
            col.append(eval(parsed, {}, local))
        results.append(col)

    return vars, combinations, results