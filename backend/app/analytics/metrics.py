from typing import Any, Dict, List, Set


class RetrievalEvaluator:
    """Evaluator computing Information Retrieval metrics (Recall@K, Precision@K, MRR)."""

    @staticmethod
    def recall_at_k(retrieved_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        """Calculate Recall@K: fraction of relevant documents retrieved in Top-K."""
        if not ground_truth_ids:
            return 0.0
        top_k_retrieved = set(retrieved_ids[:k])
        hits = top_k_retrieved.intersection(ground_truth_ids)
        return round(len(hits) / len(ground_truth_ids), 4)

    @staticmethod
    def precision_at_k(retrieved_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        """Calculate Precision@K: fraction of top-K retrieved documents that are relevant."""
        if not retrieved_ids or k <= 0:
            return 0.0
        top_k_retrieved = retrieved_ids[:k]
        hits = [doc_id for doc_id in top_k_retrieved if doc_id in ground_truth_ids]
        return round(len(hits) / len(top_k_retrieved), 4)

    @staticmethod
    def reciprocal_rank(retrieved_ids: List[str], ground_truth_ids: Set[str]) -> float:
        """Calculate Reciprocal Rank (RR): 1 / rank of first relevant document."""
        for rank, doc_id in enumerate(retrieved_ids, 1):
            if doc_id in ground_truth_ids:
                return round(1.0 / rank, 4)
        return 0.0

    @classmethod
    def evaluate_batch(
        cls,
        eval_cases: List[Dict[str, Any]],
        k_values: List[int] = [5, 10],
    ) -> Dict[str, float]:
        """Evaluate a batch of retrieval query test cases.

        eval_cases format:
        [
          {"retrieved_ids": ["D1", "D2", "D3"], "ground_truth_ids": {"D1"}},
          ...
        ]
        """
        if not eval_cases:
            return {"count": 0, "mrr": 0.0, "recall@5": 0.0, "recall@10": 0.0}

        rrs = []
        recalls_at_k = {k: [] for k in k_values}
        precisions_at_k = {k: [] for k in k_values}

        for case in eval_cases:
            retrieved = case.get("retrieved_ids", [])
            gt = set(case.get("ground_truth_ids", []))

            rrs.append(cls.reciprocal_rank(retrieved, gt))
            for k in k_values:
                recalls_at_k[k].append(cls.recall_at_k(retrieved, gt, k))
                precisions_at_k[k].append(cls.precision_at_k(retrieved, gt, k))

        n = len(eval_cases)
        mrr = round(sum(rrs) / n, 4)

        results = {
            "count": n,
            "mrr": mrr,
        }
        for k in k_values:
            results[f"recall@{k}"] = round(sum(recalls_at_k[k]) / n, 4)
            results[f"precision@{k}"] = round(sum(precisions_at_k[k]) / n, 4)

        return results
