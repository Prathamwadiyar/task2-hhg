import numpy as np
import pytest
from scripts.preprocess import (
    DatasetStats,
    clean_text,
    coerce_to_list,
    process_record,
)


def test_clean_text():
    """Test text cleaning and whitespace normalization."""
    assert clean_text(None) == ""
    assert clean_text("") == ""
    assert clean_text("   hello   world\n\n test  ") == "hello world test"
    # Verify Indic text unicode preservation
    hindi_text = "   कॉरपोरेशन   क्या  है?  \n"
    assert clean_text(hindi_text) == "कॉरपोरेशन क्या है?"


def test_coerce_to_list():
    """Test coercion of various data structures into python lists."""
    assert coerce_to_list(None) == []
    assert coerce_to_list(["a", "b"]) == ["a", "b"]
    assert coerce_to_list(np.array([1, 2, 3])) == [1, 2, 3]
    # Test string representations
    assert coerce_to_list("[0 0 1 0]") == [0, 0, 1, 0]
    assert coerce_to_list("['p1', 'p2']") == ["p1", "p2"]


def test_process_record_valid():
    """Test cleaning and metadata extraction of a valid MSMARCO-XI raw record."""
    raw_row = {
        "query_id": "101",
        "query": "  भारत  की राजधानी क्या है? ",
        "Eng_Query": "What is capital of India?",
        "Answer": " नई दिल्ली  ",
        "Eng_Answer": "New Delhi",
        "query_type": "description",
        "source_lang": "en",
        "target_lang": "hi",
        "passages": {
            "English_passages": np.array(["P1 English text", "P2 English text"]),
            "Translated_passages": np.array(["P1 Indic text", "P2 Indic text"]),
            "is_selected": np.array([0, 1]),
            "url": np.array(["http://example.com/1", "http://example.com/2"]),
        },
    }

    record = process_record(raw_row, record_idx=1)
    assert record is not None
    assert record["record_id"] == "MSMARCO-HI-101"
    assert record["query_id"] == "101"
    assert record["query_text_indic"] == "भारत की राजधानी क्या है?"
    assert record["answer_text_indic"] == "नई दिल्ली"
    assert record["num_passages"] == 2
    assert record["passages"][0]["passage_id"] == "MSMARCO-HI-101_P0"
    assert record["passages"][0]["is_selected"] is False
    assert record["passages"][1]["passage_id"] == "MSMARCO-HI-101_P1"
    assert record["passages"][1]["is_selected"] is True


def test_process_record_invalid_or_empty():
    """Test record filter out behavior on invalid/empty inputs."""
    # Empty query and empty passages should return None
    assert process_record({"query": "", "Eng_Query": ""}, record_idx=1) is None
    # No passages
    assert process_record({"query": "valid query", "passages": {}}, record_idx=1) is None


def test_dataset_stats_aggregator():
    """Test DatasetStats summary calculation."""
    stats = DatasetStats()
    stats.update(None)  # 1 removed
    
    mock_record = {
        "target_lang": "hi",
        "query_text_indic": "short query",
        "answer_text_indic": "answer",
        "passages": [
            {"passage_text_indic": "P1 text", "is_selected": True},
            {"passage_text_indic": "P2 text longer", "is_selected": False},
        ],
    }
    stats.update(mock_record)

    summary = stats.summary()
    assert summary["total_raw_records"] == 2
    assert summary["processed_records"] == 1
    assert summary["removed_records"] == 1
    assert summary["total_passages"] == 2
    assert summary["selected_passages"] == 1
    assert summary["languages_breakdown"] == {"hi": 1}
    assert summary["query_char_lengths"]["min"] == len("short query")
